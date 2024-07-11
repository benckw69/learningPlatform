const multer  = require('multer');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = req.body.fileType === file.mimetype.startsWith('image/') ? 'public/images' : 'public/videos';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
      cb(null, dir)
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname);
      }
  });
const upload = multer({ storage: storage,
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/) && !file.mimetype.startsWith('video/')) {
            cb(new Error('Please upload an image'))
          }
          cb(null, true)
        }
     });

exports.upload = upload;
