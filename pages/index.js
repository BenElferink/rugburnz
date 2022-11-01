import Head from 'next/head'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import styles from '../styles/Home.module.css'
import { VALID_SUBMISSIONS } from '../constants'
import Image from 'next/image'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [inp, setInp] = useState('')
  const [res, setRes] = useState([])

  const submitTx = async (e) => {
    e?.preventDefault()

    if (loading) {
      return
    }

    if (!inp) {
      return toast.error('Please enter a transaction ID')
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`/api/tx`, { txHash: inp })

      setInp('')
      setRes((prev) => [...prev, data])
      toast.success('Succesfully submitted transaction ID!')
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
          <img src='/media/fire.gif' alt='' width={42} height={42} />
          <h1>$rugburnz</h1>
        </div>

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
          <input placeholder='Your TX ID...' value={inp} onChange={(e) => setInp(e.target.value)} />
          <button onClick={submitTx} type='submit'>
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </form>

        {res.map(({ tier }, idx) => (
          <p key={`res-${idx}`} style={{ marginBottom: 0 }}>
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
