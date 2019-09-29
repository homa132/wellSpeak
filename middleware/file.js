const multer = require('multer');

const storage = multer.diskStorage({
    destination(req,file,cb){
        cb(null,'staticP')
    },
    filename(req,file,cb){
        cb(null,new Date.toISOString() + '-' + file.originalname)
    }
});

const types = ['audio/wav']

const fileFilter =  (req,file,cb) => {
    if(types.includes(file.mimetype)){
        cb(null,true)
    }else{ 
        cb(null,false)
    }
}

module.exports = multer({
    storage,
    fileFilter
})