const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure storage for uploaded certificate files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/certificates/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename:-{uuid}.pdf certificate
        const uniqueName = `certificate-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter to only allow PDF files
const fileFilter = (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

// Configure multer with limits and filter
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

// Export upload middleware
module.exports = upload;

