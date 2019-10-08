const express = require('express');
const mongoose = require('mongoose')
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const fileM = require('./middleware/file');
const buffer = require('buffer').Buffer;


const PORT = process.env.PORT || 80;
app.use('/audio',express.static(path.join(__dirname,'staticP')));
app.use(fileM.single('audio'));
const parserAudio = bodyParser.raw({ type: 'audio/wav',limit: '50mb'});
const parserAudioAndroid = bodyParser.raw({ type: 'audio/mpeg',limit: '50mb'});

const parseJson = bodyParser.json();

app.get('/',(req,res) => {
    res.sendfile(path.join(__dirname,'./index.html'))
})


app.post('/',parseJson,(req,res) => {
    const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
    console.log('text to speech');
    
    const textToSpeech = new TextToSpeechV1({
    iam_apikey: 'azXITHfLBN0qzaaWNa0nQKQq4so4zE_ATJHNH43QND4i',
    url: 'https://gateway-lon.watsonplatform.net/text-to-speech/api'
    });
    
    const params = {
    text: req.body.firstParam,
    voice: 'en-GB_KateV3Voice',
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
    console.log('speech to text ios');
    
    const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
    const random = Math.floor(Math.random() * 1000000000).toString();
    const name = buffer.from(random,'ascii').toString('base64');
    
    fs.writeFile(path.join(__dirname,`staticP/${name}.wav`),data,"base64",(err,resr) => {
        const speechToText = new SpeechToTextV1({
            iam_apikey: 'xGqU5meVAHz4dosthc3lrZWHLPx5et__x5YOxecVIWRQ',
            url: 'https://gateway-lon.watsonplatform.net/speech-to-text/api'
          });
          
          const params = {
            audio: fs.createReadStream(path.join(__dirname,`staticP/${name}.wav`)),
            content_type: 'audio/wav'
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

app.post('/android',parserAudioAndroid, async (req,res) => {
    const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
    console.log('speech to text android');

    const data = req.body.toString()
    const random = Math.floor(Math.random() * 1000000000).toString();
    const name = buffer.from(random,'ascii').toString('base64');
    console.log('errorecs');

    fs.writeFile(path.join(__dirname,`staticP/${name}.m4a`),data,"base64",(err,resr) => {
        console.log('error',err);
        
        convertFileFormat(path.join(__dirname,`staticP/${name}.m4a`), path.join(__dirname,`staticP/${name}.wav`), function (errorMessage) {
        }, null, function () {

            const speechToText = new SpeechToTextV1({
                iam_apikey: 'xGqU5meVAHz4dosthc3lrZWHLPx5et__x5YOxecVIWRQ',
                url: 'https://gateway-lon.watsonplatform.net/speech-to-text/api'
              });
              
              const params = {
                audio: fs.createReadStream(path.join(__dirname,`staticP/${name}.wav`)),
                content_type: 'audio/wav'
              };
              
              speechToText.recognize(params)
                .then(result => {
                    fs.unlink(path.join(__dirname,`staticP/${name}.wav`),() => {
                        fs.unlink(path.join(__dirname,`staticP/${name}.m4a`),(err) => console.log(err));
                        res.send(JSON.stringify(result));
                        res.end();
                    })
                })
                .catch(err => {
                  console.log(err);
                });
        });
    })

})

function convertFileFormat(file, destination, error, progressing, finish) {
    const ffmpeg = require('fluent-ffmpeg');

    ffmpeg(file)
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
            if (error) {
                error(err.message);
            }
        })
        .on('progress', (progress) => {
            // console.log(JSON.stringify(progress));
            console.log('Processing: ' + progress.targetSize + ' KB converted');
            if (progressing) {
                progressing(progress.targetSize);
            }
        })
        .on('end', () => {
            console.log('converting format finished !');
            if (finish) {
                finish();
            }
        })
        .save(destination);
    
        }


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