import { blockfrost } from '../../utils/blockfrost'
import connectDB from '../../utils/mongo'
import Transaction from '../../models/Transaction'
import { DESTINATION_WALLET_ADDRESS, ONE_MILLION, SECRET_CODE, VALID_SUBMISSIONS } from '../../constants'

const handler = async (req, res) => {
  try {
    await connectDB()

    const {
      method,
      body: { txHash, code },
    } = req

    switch (method) {
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

        const blockTx = await blockfrost.api.txs(txHash)
        const blockUtxos = await blockfrost.api.txsUtxos(txHash)

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
          didDownload: false,
          txHash,
          sendingAddress,
          sentAda,
          sentAssetIds,
        })

        await tx.save()

        return res.status(201).json(tx)
      }

      case 'GET': {
        const txs = await Transaction.find({ didDownload: false })

        return res.status(200).json({
          count: txs.length,
          txs,
        })
      }

      case 'PATCH': {
        if (!code) {
          return res.status(400).json({
            type: 'BAD_REQUEST',
            message: 'Please provide the following body: { code: "" }',
          })
        }

        if (code !== SECRET_CODE) {
          return res.status(401).end('Unauthorized')
        }

        const txs = await Transaction.find({ didDownload: false })

        await Promise.all(
          txs.map((tx) => {
            tx.didDownload = true
            return tx.save()
          })
        )

        return res.status(200).json({})
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

export default handler
