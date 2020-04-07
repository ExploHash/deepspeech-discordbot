const MemoryStream = new require('memory-stream');
const Ds = require("deepspeech");
var sox = require('sox-stream');

const deepspeechModelDir = "./deepspeech/model061/"

let model;

let queue = [];

module.exports = {
  init: function(){
    model = new Ds.Model(deepspeechModelDir + "output_graph.pbmm", 1024);
    model.enableDecoderWithLM(deepspeechModelDir + "lm.binary", deepspeechModelDir + "trie", 0.75, 1.85);
  },
  addToQueue: function(stream, username){
    var audioStream = new MemoryStream();
    this.convertsox(stream, audioStream);

    audioStream.on('finish', () => {
      console.log("Added to queue");
      let audioBuffer = audioStream.toBuffer();
      const audioLength = (audioBuffer.length / 2) * (1 / 16000);
      if(audioLength > 1.5){
        queue.push({
          buffer: audioBuffer, username, length: audioLength
        });
      }else{
        console.log("Skipped");
      }
    })
  },
  convertsox: function(inputstream, outputstream){
    let options = {
      global: {
        'no-dither': true,
      },
      input: {
        type: "raw",
        encoding: "signed-integer",
        b: 16,
        endian: "little",
        channels: 2,
        rate: 48000,
      },
      output: {
        b: 16,
        rate: 16000,
        channels: 1,
        encoding: 'signed-integer',
        compression: 0.0,
        endian: 'little',
        type: 'raw'
      }
    }
    inputstream.pipe(sox(options)).pipe(outputstream);
  },

  startQueue: async function(callback){
    while(true){
      let items = queue.splice(0, 1);
      if(items.length != 0){
        let item = items[0];
        console.log("Calculating new result");
        let result = model.stt(item.buffer.slice(0, item.buffer.length / 2));
        console.log("New result");
        callback(item.username, item.length, result);
      }else{
        await new Promise((res) => setTimeout(() => res(), 1000));
      }
    }
  }
}