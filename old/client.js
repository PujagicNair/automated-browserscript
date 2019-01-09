const io = require('socket.io-client');

window.socket = io();

socket.on('res', res => {
    Object.keys(res).forEach(key => document.getElementById(key).innerText = res[key]);
    $('#last_tick').html(new Date().toString().slice(0, 25));
});

socket.on('error', msg => alert(msg));

socket.on('levels', levels => {
    let $l = $('#levels');
    $l.empty();
    levels.forEach(l => {
        let key = l.match(/\[(.+?)\]/)[1];
        $l.append(`<tr>
            <td><b>${key}</b></td>
            <td>${l.split('-')[0].trim()}</td>
            <td>${l.split('-')[1].trim()}</td>
        </tr>`);
    });
});

socket.on('screen', b64 => {
    $('#screen').attr('src', 'data:image/jpeg;base64,' + b64);
});

socket.on('reload frame', () => reloadFrame());

socket.on('var changed', (name, value) => {
    $('#status [data-name=' + name + ']').html(value.toString());
    if (name == 'paused') {
        let $pb = $('#pause_button');
        $pb.removeAttr('disabled');
        $pb.text(value ? 'Resume' : 'Pause');
    }
});

socket.on('next check', time => {
    $('#next_action_time').html(new Date(time).toString().slice(0, 25));
});

let logs = [];
socket.on('logs', lgs => {
    logs = logs.concat(lgs);
    let $l = $('#logs');
    $l.empty();
    logs.forEach(l => {
        $l.append('<li>' + l + '</li>');
    });

    $('#last_action').html(logs[logs.length - 2]);
    $('#next_action').html(logs[logs.length - 1]);
});

socket.on('queue', lgs => {
    let $l = $('#queue');
    $l.empty();
    lgs.forEach(l => {
        $l.append('<li>' + l + '</li>');
    });
});

socket.on('building', lgs => {
    let $l = $('#building');
    $l.empty();
    lgs.forEach(l => {
        $l.append('<li>' + l + '</li>');
    });
});

