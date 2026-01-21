// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir('uploads/products');
ensureDir('uploads/attachments');
ensureDir('uploads/feedback');
ensureDir('uploads/evidence');  

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.upload_type || 'products';
    cb(null, `uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = req.body.upload_type === 'products' ? 'product-' : '';
    cb(null, `${prefix}${uniqueSuffix}${ext}`);
  }
});

const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/evidence/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const type = req.body.upload_type || 'products';
  
  let allowedTypes;
  if (type === 'products') {
    allowedTypes = /jpeg|jpg|png|webp/;
  } else {
    allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  }
  
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    const message = type === 'products' 
      ? 'Only image files (JPEG, JPG, PNG, WebP) are allowed'
      : 'Only images and documents are allowed';
    cb(new Error(message), false);
  }
};


const evidenceFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and documents (PDF, DOC, DOCX, TXT) are allowed for evidence'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  },
  fileFilter
});

const uploadEvidence = multer({
  storage: evidenceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 1  
  },
  fileFilter: evidenceFileFilter
});

const uploadProductImages = upload.array('images', 5);
const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 5);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  upload,
  uploadProductImages,
  uploadSingle,
  uploadMultiple,
  uploadEvidence,  
  handleUploadError
};