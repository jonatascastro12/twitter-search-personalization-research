const fs = require('fs');
const slugify = require('slugify');

const save_results = (agent, session_id, term, results)=>{
    const json = JSON.stringify(results);
    let datetime = slugify((new Date()).toISOString()).replace(/[\:\.]/g,'-');
    let slug = slugify(term).replace(/\:/g, '_');
    fs.writeFileSync(__dirname + `\\..\\results\\${session_id}__${slug}__${agent.id}__${datetime}.json`, json, 'utf8');
}

module.exports = save_results;