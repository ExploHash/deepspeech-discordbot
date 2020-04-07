const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require("ytdl-core");
const youtubeSearch = require("youtube-search");
const deepspeech = require("./modules/deepspeech");
deepspeech.init();

const youtubeApiKey = "";
const discordToken = "";

client.login(discordToken);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  if (msg.content === '*join') {
    let voiceChannel = msg.guild.channels.cache.find(channel => channel.type === "voice" && channel.members.has(msg.author.id));
    let conn = await voiceChannel.join();

    conn.play(ytdl('https://www.youtube.com/watch?v=eE7K0kp7RQc', { quality: 'highestaudio' }));
    conn.on("speaking", (user, speaking) => speaking && listenSpeak(conn, msg, user));

    deepspeech.startQueue((username, length, result) => {
      msg.channel.send(`${username} (${length}): ${result}`);
      let location = result.indexOf("lay")
      if (location != -1) {
        youtubeSearch(result.substring(location + 1, result.length), {key: youtubeApiKey, limit: 1}, function (err, results) {
          if (err) return console.log(err);
          conn.play(ytdl(results[0].link))
        });
      }
    });
  }
});



async function listenSpeak(conn, msg, user) {
  console.log(`I'm listening to ${user.username}`);
  const audioStream = conn.receiver.createStream(user, { mode: "pcm", end: "silence" });
  deepspeech.addToQueue(audioStream, user.username);
}