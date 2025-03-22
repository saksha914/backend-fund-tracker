const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  title: { type: String, required: false },
  analysis: {
    project: { type: String, default: "Unknown Project" },
    financialDetails: {
      totalBudget: { type: Number, default: 0 },
      fundsSpent: { type: Number, default: 0 },
      remainingFunds: { type: Number, default: 0 },
      percentageUtilized: { type: Number, default: 0 },
    },
    summary: { type: String },
  },
});

module.exports = mongoose.model("Report", ReportSchema);
