import { Fragment } from 'react'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <Fragment>
      <Toaster />
      <Component {...pageProps} />
    </Fragment>
  )
}

export default MyApp
