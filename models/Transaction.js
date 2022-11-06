import mongoose from 'mongoose'

const Transaction = new mongoose.Schema(
  {
    timestamp: {
      type: mongoose.Schema.Types.Number,
    },
    tier: {
      type: mongoose.Schema.Types.String,
    },
    didDownload: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    txHash: {
      type: mongoose.Schema.Types.String,
    },
    sendingAddress: {
      type: mongoose.Schema.Types.String,
    },
    sentAda: {
      type: mongoose.Schema.Types.Number,
    },
    sentAssetIds: [
      {
        type: mongoose.Schema.Types.String,
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
    // this creates and maintains:
    // {
    //   createdAt: Date,
    //   updatedAt: Date,
    // }
  }
)

export default mongoose.models.Transaction ?? mongoose.model('Transaction', Transaction)
