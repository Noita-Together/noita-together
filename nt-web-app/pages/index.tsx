import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '../styles/Home.module.css'
import {useEffect, useState} from "react";
import {healthcheckUrl} from '../utils/GameServerApi';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [serverStatus, setServerStatus] = useState<string>("CHECKING")
  useEffect(()=>{
     fetch(healthcheckUrl)
      .then((res: Response) => {
        setServerStatus(res.status === 200 ? 'ONLINE' : 'OFFLINE')
      })
      .catch(() => {
        setServerStatus('ERROR')
      })
  }, [])

  return (
    <>
      <Head>
        <title>Noita together</title>
        <meta name="description" content="Play alone together" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={`${styles.inner}`}>
          <div className={styles.description}>
            <p>
              Noita Together
            </p>
            <div>
              Play alone together
            </div>
          </div>

          <div style={{color: serverStatus === "ONLINE" ? "white" : "red"}}>Server Status: {serverStatus}</div>

          {/*<div className={styles.center}>
          <div>
            Noita Together
          </div>
        </div>*/}

          <div className={styles.grid}>
            <a
                href="https://github.com/Noita-Together/noita-together/releases"
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
            >
              <h2>
                Github <span>-&gt;</span>
              </h2>
              <p>
                Find the source code, links to install, and contributors
              </p>
            </a>

            <a
                href="https://github.com/Noita-Together/noita-together/wiki"
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
            >
              <h2>
                Wiki <span>-&gt;</span>
              </h2>
              <p>
                Find information on FAQ, how to install, and usage
              </p>
            </a>

            {/*<a*/}
            {/*    href="/"*/}
            {/*    className={styles.card}*/}
            {/*>*/}
            {/*  <h2>*/}
            {/*    Stats (TODO) <span>-&gt;</span>*/}
            {/*  </h2>*/}
            {/*  <p>*/}
            {/*    Look up statistics for previous runs*/}
            {/*  </p>*/}
            {/*</a>*/}

            {/*<a*/}
            {/*    href="/"*/}
            {/*    className={styles.card}*/}
            {/*>*/}
            {/*  <h2>*/}
            {/*    Lobbies (TODO) <span>-&gt;</span>*/}
            {/*  </h2>*/}
            {/*  <p>*/}
            {/*    Find information on current games in progress*/}
            {/*  </p>*/}
            {/*</a>*/}
          </div>
          <p className={styles.disclaimer}>
            Nolla games and Noita are
            registered trademarks of Nolla games (https://nollagames.com/) which is not overseeing, involved with, or
            responsible for this activity, product, or service.
          </p>
        </div>

      </main>
    </>
  )
}

// This gets called on every request
export async function getServerSideProps() {
  // Fetch data from external API


  // Pass data to the page via props
  return { props: {  } }
}
