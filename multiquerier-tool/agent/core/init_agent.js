const puppeteer = require('puppeteer');
const saveResults = require('./save_results');

const newPage = async (browser)=>{
    let page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 1500,
        deviceScaleFactor: 1,
      });
    return page;
};


const initAgent = (async (socket, agent) => {
    console.log('initAgent', agent.id)
    const browser = await puppeteer.launch();
    let page = await newPage(browser);

    let close = false;

    const platform = new (require(`../platforms/${agent.platform}`))(page, agent);

    socket.on('login', async (data) => {
        console.log('login');
        await platform.doLogin();
        socket.emit('ack_login', { agent_id: agent.id })
    })

    socket.on('login_agent', async (agent_id) => {
        if (agent_id == agent.id)
            await platform.doLogin();
    })

    socket.on('run_query', async ({ query, date_intervals = [""], max_results, session_id }) => {
        await page.close();
        page = await newPage(browser);
        platform.setNewPage(page);

        for (let date in date_intervals) {
            let term = query;
            if (date !== "") {
                term = `${query} ${date_intervals[date]}`;
            }
            let results = await platform.doSearch(term, max_results);
            saveResults(agent, session_id, term, results);
        }
        socket.emit('end_query', { agent_id: agent.id, query });
    })

    socket.on('run_follow', async ({ agent_id, profile }) => {
        if (agent_id != agent.id) return;
        console.log('run_follow', agent_id, profile);
        await platform.doFollow(profile);
        socket.emit('end_follow', { agent_id: agent.id, profile })
    })


    let init_socket = async (data) => {
        socket.removeAllListeners('login');
        socket.removeAllListeners('login_agent');
        socket.removeAllListeners('run_query');
        socket.removeAllListeners('run_follow');
        socket.removeListener('init', init_socket);
        await page.close();
        await browser.close();
        close = true;
    }

    socket.on('init', init_socket);

    socket.emit('ack_init_agent', agent.id);
    
    await (async () => {
        while (!close) {
            if (page && page.screenshot){
                try{
                    let image = await page.screenshot({ encoding: 'base64' });
                    socket.emit('screenshot', { id: agent.id, data: image });
                    await page.waitFor(500);
                }catch(e){
                    await new Promise((res,rej)=>setTimeout(()=>res(), 1000));
                    console.log('page closed... waiting new...')
                }
                
            }
        }
    })();

    console.log('FINISH AGENT!!');
});

module.exports = initAgent;