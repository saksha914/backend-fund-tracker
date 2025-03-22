const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const Report = require("../models/report");

const router = express.Router();

// ✅ Configure Multer to accept multiple files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Upload directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ✅ Accept multiple PDFs under the same field name ("pdf_file")
router.post("/upload", upload.array("pdf_file", 10), async (req, res) => {
  try {
    console.log("Request received:", req.body, req.files); // Debugging logs

    const pdfFiles = req.files;

    if (!pdfFiles || pdfFiles.length === 0) {
      return res.status(400).json({ error: "At least one PDF file is required." });
    }

    let allResults = [];

    // ✅ Process each uploaded PDF file
    for (const pdfFile of pdfFiles) {
      const formData = new FormData();
      formData.append("pdf_file", fs.createReadStream(pdfFile.path), pdfFile.originalname);

      // ✅ Send request to Django API for each file
      const apiResponse = await axios.post("http://127.0.0.1:8000/api/upload-summarize-pdf/", formData, {
        headers: { ...formData.getHeaders() },
      });

      const { results } = apiResponse.data;
      allResults.push(...results);

      // ✅ Delete uploaded temp file after processing
      fs.unlinkSync(pdfFile.path);
    }

    // ✅ Save all results in MongoDB
    const documents = allResults.map((item) => ({
      fileName: item.fileName,
      analysis: item.analysis || {},
    }));

    const insertedReports = await Report.insertMany(documents);

    return res.status(201).json({
      message: `${insertedReports.length} reports stored successfully`,
      results: insertedReports,
    });
  } catch (error) {
    console.error("Error processing PDF upload:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
