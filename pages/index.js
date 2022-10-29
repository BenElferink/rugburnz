import Head from 'next/head'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import styles from '../styles/Home.module.css'

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

      <main className={styles.main}>
        <h1>Submit a Transaction ID</h1>
        <p>Please submit a valid transaction ID</p>

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
          <a href='https://badfoxmc.com' target='_blank'>
            Bad Fox Motorcycle Club
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
