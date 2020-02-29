
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const initAgent = require('./core/init_agent');
let config = {};



http.listen(30001, function(){
   console.log('listening on *:30001');
});


io.on('connection', async (socket)=>{
    console.log('connected with manager');

    socket.on('disconnect', async ()=>{
        console.log('disconnected from manager');
        for (const id in config.agents){
            if ('browser' in config.agents[id]){
                config.agents[id]['browser'].close();
            }else{
                delete config.agents[id];
            }
        }
    });
    
    socket.on('init', async (data)=>{
        console.log('init', data.session_id);
        config = data;
        for (let id in config.agents){
            initAgent(socket, config.agents[id]);
        }
        socket.emit('ack_init', config);
    });
});




