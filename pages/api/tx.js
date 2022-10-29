import connectDB from '../../utils/mongo'
import Transaction from '../../models/Transaction'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js'
import { BLOCKFROST_API_KEY, DESTINATION_WALLET_ADDRESS, ONE_MILLION, VALID_SUBMISSIONS } from '../../constants'

// https://github.com/blockfrost/blockfrost-js
const blockfrost = new BlockFrostAPI({
  projectId: BLOCKFROST_API_KEY,
})

export default async (req, res) => {
  try {
    await connectDB()

    const {
      method,
      body: { txHash },
    } = req

    switch (method) {
      case 'GET': {
        const txs = await Transaction.find({})

        return res.status(200).json({
          count: txs.length,
          txs,
        })
      }

      case 'POST': {
        if (!txHash) {
          return res.status(400).json({
            type: 'BAD_REQUEST',
            message: 'Please provide the following body: { txHash: "" }',
          })
        }

        let tx = await Transaction.findOne({ txHash })

        if (tx) {
          return res.status(400).json({
            type: 'BAD_REQUEST',
            message: 'TX already submitted',
          })
        }

        const blockTx = await blockfrost.txs(txHash)
        const blockUtxos = await blockfrost.txsUtxos(txHash)

        let sentAda = 0
        const sentAssetIds = []

        blockUtxos.outputs.forEach(({ address, amount }) => {
          if (address === DESTINATION_WALLET_ADDRESS) {
            amount.forEach(({ unit, quantity }) => {
              if (unit === 'lovelace') {
                sentAda = Number(quantity / ONE_MILLION)
              } else {
                sentAssetIds.push(unit)
              }
            })
          }
        })

        let validTier = ''

        VALID_SUBMISSIONS.forEach(({ name, requiredAda, requiredNfts }) => {
          if (sentAssetIds.length === requiredNfts && sentAda >= requiredAda - 2 && sentAda <= requiredAda + 2) {
            validTier = name
          }
        })

        if (!validTier) {
          return res.status(400).json({
            type: 'BAD_REQUEST',
            message: "TX didn't include required/valid lovelace & assets",
          })
        }

        let sendingAddress = ''

        blockUtxos.inputs.forEach(({ address, amount }) => {
          amount.forEach(({ unit }) => {
            if (sentAssetIds.includes(unit)) {
              sendingAddress = address
            }
          })
        })

        tx = new Transaction({
          timestamp: Number(`${blockTx.block_time}000`),
          tier: validTier,
          txHash,
          sendingAddress,
          sentAda,
          sentAssetIds,
        })

        await tx.save()

        return res.status(201).json(tx)
      }

      default: {
        res.setHeader('Allow', 'GET')
        res.setHeader('Allow', 'POST')
        return res.status(405).end('Method Not Allowed')
      }
    }
  } catch (error) {
    console.error(error.message)

    return res.status(500).json({})
  }
}
