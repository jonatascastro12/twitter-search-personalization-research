// GO TO BOTTOM
// document.children[0].scrollTo(0,document.children[0].scrollHeight)

// CAPTURE TWEETS WITH AS [TEXT_CONTENT, DATE]
// $$('div[lang]').map(e => [e.innerText, e.parentElement.querySelector('time') ? e.parentElement.querySelector('time').getAttribute('datetime') : null])


class TwitterSearch {
    constructor(page, agent) {
        this.page = page; // Puppeeter Page Object
        this.agent = agent;
        this.results = {};
    }

    setNewPage(page){
        this.page = page;
    }

    async doLogin() {
        const EXPLORE_ANCHOR = 'a[href="/explore"]';
        const LOGIN_INPUT_SELECTOR = 'input[name="session[username_or_email]"]';
        const PASSWORD_INPUT_SELECTOR = 'input[type="password"]';
        await this.page.goto('https://twitter.com/login');
        await this.page.waitForSelector(LOGIN_INPUT_SELECTOR);
        await this.page.waitFor(500);
        await this.page.type(LOGIN_INPUT_SELECTOR, this.agent.username, {delay: 50});
        await this.page.keyboard.press('Tab');
        await this.page.waitFor(500);
        await this.page.type(PASSWORD_INPUT_SELECTOR, this.agent.password, {delay: 50});
        await this.page.keyboard.press('Enter');
        await this.page.waitForSelector(EXPLORE_ANCHOR);
        await this.page.waitFor(10000);
    }


    async doSearch(term, maxResults) {
        console.log('doSearch', term, 'maxResults: ', maxResults);
        await this.doQuery(term);

        const MOST_RECENT_TAB = 'a[href$="f=live"]';
        const PEOPLE_TAB = 'a[href$="f=user"]';
        const PHOTOS_TAB = 'a[href$="f=image"]'
        const VIDEO_TAB = 'a[href$="f=video"]'

        this.results.main_tab = await this.fetchTweetResults(term, maxResults, null);
        this.results.most_recent_tab = await this.fetchTweetResults(term, maxResults, MOST_RECENT_TAB);
        this.results.people_tab = await this.fetchTweetResults(term, maxResults, PEOPLE_TAB);
        this.results.photos_tab = await this.fetchTweetResults(term, maxResults, PHOTOS_TAB);
        this.results.videos_tab = await this.fetchTweetResults(term, maxResults, VIDEO_TAB);

        return this.results;
    }


    async doQuery(term) {
        // // MAKE QUERY
        const EXPLORE_ANCHOR = 'a[href="/explore"]';
        const SEARCH_INPUT_SELECTOR = 'input[type="text"]';
        
        await this.page.goto('https://twitter.com/');
        await this.page.waitForSelector(EXPLORE_ANCHOR);
        await this.page.click(EXPLORE_ANCHOR);
        await this.page.waitForSelector(SEARCH_INPUT_SELECTOR);

        await this.page.type(SEARCH_INPUT_SELECTOR, term, {delay: 50});
        await this.page.keyboard.press('Enter');

        await this.page.waitFor(2000);
    }

    async fetchTweetResults(term, maxResults, TAB) {
        
        let allTweets = [];
        let retries = 0;
        let previousHeight;
        let TWEETS_SELECTOR

        try {
            console.log("FETCH RESULTS for tab", TAB);
            TWEETS_SELECTOR = 'article';
            if (TAB && TAB.indexOf('user') !== -1){
                TWEETS_SELECTOR = 'div[aria-label*=Timeline] div[data-testid="UserCell"]'
            }

            if (TAB){
                await this.page.waitForSelector(TAB);
                let TAB_ELEMENT = await this.page.$$(TAB);
                await TAB_ELEMENT[1].tap();
                await this.page.waitFor(1000);
            }

            await this.page.waitForSelector(TWEETS_SELECTOR, {timeout:5000});
        }catch(e) {
            console.log('timeout... or other error...');
            return [];
        }

        while (Object.keys(allTweets).length < maxResults) {
            try {
                const results = await this.page.evaluate(({allTweets, TWEETS_SELECTOR, TAB}) => {
                    const tweets = [];
                    document.querySelectorAll(TWEETS_SELECTOR).forEach(e => {
                        try{
                            if (TAB && TAB.indexOf('user') !== -1){
                                let name, profile, description;
                                let nameObj =  e.querySelector('div>div>div>div>div>div>div>div>div>div div>div');
                                if (nameObj){
                                    name = nameObj.textContent;
                                }
                                let profileObj = e.querySelector('div>div>div>div>div>div>div>div>div>div div:nth-child(2) span');
                                if (profileObj){
                                    profile = profileObj.textContent
                                }
                                let descriptionObj = e.querySelector('div>div>div>div>div>div>div:nth-child(2)>div:nth-of-type(2) span')
                                if (descriptionObj){
                                    description = descriptionObj.textContent
                                }

                                let index = allTweets.findIndex((v)=> v.profile == profile);
                                
                                if (index === -1){
                                    tweets.push({name, profile, description});
                                }

                            }else{
                                let text = e.querySelector('div[lang]').innerText;
                                let datetime = e.querySelector('time').getAttribute('datetime');
                                let url = e.querySelector('time').parentElement.getAttribute('href');
                                let generalData = [];
                                e.querySelectorAll('div[dir]').forEach(c => generalData.push(c.textContent))
                                
                                let index = allTweets.findIndex((v)=> v.url == url);
                                
                                if (index === -1){
                                    tweets.push({text, datetime, url, generalData});
                                }
                            }
                        }catch(e){
                            console.log('skiped a tweet...')
                        }

                        
                    });
                    return tweets;
                }, {allTweets, TWEETS_SELECTOR, TAB});
                
                if (results.length == 0){
                    break;
                }

                allTweets = allTweets.concat(results);
                
                console.log(Object.keys(allTweets).length);

                previousHeight = await this.page.evaluate('document.body.scrollHeight');
                await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                await this.page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, {timeout: 6000});
                await this.page.waitFor(500);
                // await document.querySelector(TWEETS_SELECTOR + ':last-child')
                //     .scrollIntoView({behavior: 'smooth', block: 'end', inline: 'end'});
            }catch(e){
                console.log('timeout... moving page to continue...');
                if (retries >1){
                    break;
                }
                await this.page.evaluate('window.scrollTo(0, 0)');
                await this.page.waitFor(1000);
                await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight-500)');
                await this.page.waitFor(1000);
                await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                retries++;
            }
        }

        return allTweets;
    }

    async doFollow(profile) {
        const FOLLOW_BUTTON_SELECTOR = 'div>div>div>div>div>div>div>div>div>div>div>div>div>div>div[role="button"][data-testid*="-follow"]';
        await this.page.goto(`https://twitter.com/${profile}`);
        try{
            await this.page.waitFor(FOLLOW_BUTTON_SELECTOR, {timeout: 3000});
            await this.page.click(FOLLOW_BUTTON_SELECTOR);
        }catch(e){
            console.log('already followed')
        }
        await this.page.waitFor(5000);

    }

    csvHeader() {
        return [
            {id: 'content'},
            {id: 'datetime'},
        ]
    }

    //
    // async fetchCards(labelMap) {
    //     await this.page.waitForSelector(GOOGLE_SECTIONS_SELECTOR);
    //     const lang = await this.page.evaluate(() => document.querySelector('html').lang);
    //     let label = this.getLabelForLang(lang, labelMap);
    //     console.log("FETCHING ", label);
    //     const topStories = await this.page.evaluate(({ GOOGLE_SECTIONS_SELECTOR, label }) => {
    //         const links = [];
    //         document.querySelectorAll(GOOGLE_SECTIONS_SELECTOR).forEach(section => {
    //             const h3 = section.querySelector('h3[role="heading"]');
    //             if (h3 && h3.innerText.indexOf(label) !== -1) {
    //                 section.querySelectorAll('a[ping]').forEach(a => links.push(a.href));
    //             }
    //         });
    //         return links;
    //     }, { GOOGLE_SECTIONS_SELECTOR, label });
    //
    //     return topStories;
    // }

}

module.exports = TwitterSearch;
