import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { BrowserWallet } from '@martifylabs/mesh'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import writeXlsxFile from 'write-excel-file'
import styles from '../styles/Home.module.css'
import { SECRET_CODE, VALID_SUBMISSIONS } from '../constants'

export default function Home() {
  const [availableWallets, setAvailableWallets] = useState([])
  const [showWallets, setShowWallets] = useState(false)

  useEffect(() => {
    setAvailableWallets(BrowserWallet.getInstalledWallets())
  }, [])

  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [wallet, setWallet] = useState({})
  const [isRugburnz, setIsRugburnz] = useState(false)

  const connectWallet = async (_walletName) => {
    if (connecting) return
    setConnecting(true)

    try {
      const _wallet = await BrowserWallet.enable(_walletName)
      if (_wallet) {
        setWallet(_wallet)
        setConnected(true)

        const adaHandles = await _wallet.getPolicyIdAssets(
          'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a'
        )

        let isOwner = false
        for (const { assetName } of adaHandles) {
          if (assetName === 'rugburnz') isOwner = true
        }

        setIsRugburnz(isOwner)

        if (isOwner) {
          toast.success('Wallet is $rugburnz owner!')
        } else {
          toast.error('Wallet is not $rugburnz owner!')
        }
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    }

    setConnecting(false)
  }

  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [submissions, setSubmissions] = useState([])

  const submitTx = async (e) => {
    e?.preventDefault()

    if (loading) return
    if (!txHash) return toast.error('Please enter a transaction ID')

    setLoading(true)

    try {
      const { data } = await axios.post('/api/tx', { txHash })

      setTxHash('')
      setSubmissions((prev) => [...prev, data])
      toast.success('Succesfully submitted transaction ID!')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message ?? error?.message ?? 'An unexpected error occurred')
    }

    setLoading(false)
  }

  const downloadRecords = async () => {
    if (loading) return

    setLoading(true)

    try {
      toast.loading('Collecting records...')

      const {
        data: { txs },
      } = await axios.get('/api/tx')

      const payload = [
        [
          {
            value: 'TX Block Time (UTC)',
            fontWeight: 'bold',
          },
          {
            value: 'Tier',
            fontWeight: 'bold',
          },
          {
            value: 'TX Hash (ID)',
            fontWeight: 'bold',
          },
          {
            value: 'Sending Address',
            fontWeight: 'bold',
          },
        ],
        ...txs.map(({ timestamp, tier, txHash, sendingAddress }) => [
          {
            type: String,
            value: new Date(timestamp).toUTCString(),
          },
          {
            type: String,
            value: tier,
          },
          {
            type: String,
            value: txHash,
          },
          {
            type: String,
            value: sendingAddress,
          },
        ]),
      ]

      toast.loading('Writing file...')

      await writeXlsxFile(payload, {
        fileName: `$rugburnz records (${new Date().toLocaleString()}).xlsx`,
        columns: [{ width: 25 }, { width: 15 }, { width: 70 }, { width: 100 }],
      })

      await axios.patch('/api/tx', { code: SECRET_CODE })

      toast.success('Done!')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message ?? error?.message ?? 'An unexpected error occurred')
    }

    setLoading(false)
  }

  return (
    <div className={styles.root}>
      <Head>
        <title>$rugburnz</title>
        <link rel='icon' href='/media/fire.png' />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <button className={styles.flame} onClick={() => setShowWallets((prev) => !prev)}>
            <img src='/media/fire.gif' alt='' width={42} height={42} />
          </button>
          <h1>$rugburnz</h1>
        </div>

        {connected ? (
          isRugburnz ? (
            <button className={styles.download} onClick={downloadRecords} disabled={loading}>
              Download Records (.xlsx)
            </button>
          ) : null
        ) : showWallets ? (
          availableWallets.length == 0 ? (
            <div>No wallets installed</div>
          ) : (
            <div className={styles.wallets} style={{ bottom: `-${availableWallets.length * 61}px` }}>
              {availableWallets.map((wallet, idx) => (
                <button
                  key={`connect_wallet_${wallet.name}`}
                  disabled={connecting || connected}
                  onClick={() => connectWallet(wallet.name)}
                >
                  <Image src={wallet.icon} alt={wallet.name} width={42} height={42} />
                  {wallet.name}
                </button>
              ))}
            </div>
          )
        ) : null}

        <a className={styles.discord} href='https://discord.gg/7Pm2jwy2' target='_blank' rel='noreferrer'>
          <Image src='/media/discord.webp' alt='Discord' width={42} height={42} />
        </a>
      </header>

      <main className={styles.main}>
        <h2>Burn your sh*t!</h2>
        <p>
          Send ADA + NFTs to <u>$rugburnz</u> as per one of the following tiers:
        </p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>ADA</th>
              <th>NFTs</th>
            </tr>
          </thead>
          <tbody>
            {VALID_SUBMISSIONS.map(({ name, requiredAda, requiredNfts }) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{requiredAda}</td>
                <td>{requiredNfts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>And then submit your transaction ID here:</p>

        <form onSubmit={submitTx} className={styles.form}>
          <input placeholder='Your TX ID...' value={txHash} onChange={(e) => setTxHash(e.target.value)} />
          <button onClick={submitTx} type='submit'>
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </form>

        {submissions.map(({ tier }, idx) => (
          <p key={`submissions-${idx}`} style={{ marginBottom: 0 }}>
            Succesfully submitted TX for: {tier}
          </p>
        ))}
      </main>

      <footer className={styles.footer}>
        <p>
          Developed by&nbsp;
          <a href='https://badfoxmc.com' target='_blank' rel='noreferrer'>
            Bad Fox Motorcycle Club
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
