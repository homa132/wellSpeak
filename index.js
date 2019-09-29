const express = require('express');
const mongoose = require('mongoose')
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const fileM = require('./middleware/file');
const buffer = require('buffer').Buffer;


const PORT = process.env.PORT || 4000;
app.use('/audio',express.static(path.join(__dirname,'staticP')));
app.use(fileM.single('audio'));
const parserAudio = bodyParser.raw({ type: 'audio/wav',limit: '50mb'});
const parseJson = bodyParser.json();

app.get('/',(req,res) => {
    res.send('hello pidor')
})


app.post('/',parseJson,(req,res) => {
    const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');

    const textToSpeech = new TextToSpeechV1({
    iam_apikey: 'Rnrlq5c05WhxJC7ySxxixEab-tNoR0GzMoX-lTKGy9P4',
    url: 'https://stream-fra.watsonplatform.net/text-to-speech/api'
    });
    
    const params = {
    text: req.body.firstParam,
    voice: 'en-US_AllisonVoice',
    accept: 'audio/mp3'
    };

    textToSpeech
    .synthesize(params)
    .then(audio => {
        audio.pipe(fs.createWriteStream(path.join(__dirname,`staticP/${req.body.userToken}.mp3`)));
        res.send('good')
    })
    .catch(err => {
        console.log(err);
    });
})

app.post('/post',parserAudio, async (req,res) => {
    const data = req.body.toString();
    
    const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
    const random = Math.floor(Math.random() * 1000000000).toString();
    const name = buffer.from(random,'ascii').toString('base64');
    
    fs.writeFile(path.join(__dirname,`staticP/${name}.wav`),data,"base64",(err,resr) => {
        const speechToText = new SpeechToTextV1({
            iam_apikey: 'jmpFvkhJcKyPz5ervIVHH-rcFsmZZV-8LqsTBWB1NbFx',
            url: 'https://gateway-lon.watsonplatform.net/speech-to-text/api'
          });
          
          const params = {
            audio: fs.createReadStream(path.join(__dirname,`staticP/${name}.wav`)),
            content_type: 'audio/l16;rate=16000'
          };
          
          speechToText.recognize(params)
            .then(result => {
                fs.unlink(path.join(__dirname,`staticP/${name}.wav`),() => {
                    res.send(JSON.stringify(result));
                    res.end();
                })
            })
            .catch(err => {
              console.log(err);
            });
    })
})



async function start () {
    try{
        const url = 'mongodb+srv://wellSpeak:2PvhigfBHrD00FI0@cluster0-kq54q.mongodb.net/test?retryWrites=true&w=majority';

        await mongoose.connect(url,{useNewUrlParser: true,useUnifiedTopology: true});
        app.listen(PORT, () => {
            console.log('hi');
            
        })
    }catch(err){
        console.log(err);
    }
}

start();