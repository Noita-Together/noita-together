import Head from 'next/head'
import {Inter} from 'next/font/google'
import styles from '../../styles/Login.module.css'
import {useEffect, useState} from "react";
import {useRouter} from 'next/router'

const inter = Inter({subsets: ['latin']})

export interface UserLocalStorageObject {
    display_name: string,
    refresh: string
}

export interface UserSessionStorageObject{
    display_name: string,
    token: string|undefined,
    expires_in: string,
    e: string
}

export default function Login(props) {
    const [user, setUser] = useState<UserSessionStorageObject | undefined>(undefined)
    const router = useRouter()
    const {code, state, scope, error, status} = router.query
    const [codeFetching, setCodeFetching] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    useEffect(()=>{
        if(status !== 'login_valid' || !user) return
        const url = `${props.NOITA_APP_REDIRECT_URI}/?token=${user.token}&expires_in=28800${user.e ? `&e=${user.e}` : ''}`
        window.location.href = url
    }, [status, user])

    useEffect(()=>{
        setRememberMe(localStorage.getItem('saveTokens') === 'true')
        const authJSON = sessionStorage.getItem('auth')
        const lastLogin = sessionStorage.getItem('lastLogin')
        const refreshAuthInfo = localStorage.getItem('auth')
        if (!authJSON || !lastLogin){
            if(refreshAuthInfo){
                console.log('TODO refresh auth!')
            }
            return
        }
        const auth = JSON.parse(authJSON) as UserSessionStorageObject
        const expiration = new Date(lastLogin).getTime()+(parseInt(auth.expires_in)*1000)
        if(Date.now() > expiration){
            console.log('Access Token Expired! Refresh token check!')
            //TODO refresh tokens using localstorage if able
            auth.token = undefined
        }
        setUser(auth)
    }, [])

    useEffect(() => {
        if (!code || !state || !scope || codeFetching) return
        const params = new URLSearchParams(router.query);
        setCodeFetching(true)
        fetch(`/api/auth/code?${params.toString()}`, {
            headers: {
                'accept': 'application/json'
            }
        }).then((response)=>response.json())
            .then((a)=>{
                if(a.error){throw new Error(a)}
                sessionStorage.setItem('auth', JSON.stringify(a))
                sessionStorage.setItem('lastLogin', new Date().toISOString())
                if(localStorage.getItem('saveTokens')){
                    localStorage.setItem('auth', JSON.stringify({
                        display_name: a.display_name,
                        refresh: a.refresh
                    } as UserLocalStorageObject))
                }
                window.location.href = '/account?status=login_valid'
            })
            .catch((e)=>{
                console.error(e)
                window.location.href = '/account?error=twitch_auth_failed'
            })
    }, [code, state, scope, codeFetching])

    if (code && state && scope) {
        return <div>Loading...</div>
    }
    return (
        <>
            <Head>
                <title>Noita together</title>
                <meta name="description" content="Play alone together"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className={`${styles.main} ${inter.className}`}>
                {error && <div className={styles.error}>An error occurred while attempting to sign in: {error}</div>}
                <div>Choose an authentication method to use for Noita Together</div>
                {user && <>
                    <button className={styles.loginButton}>
                        Continue as {user.display_name}
                    </button>
                    <div>
                        OR
                    </div>
                </>}

                <button className={`${styles.loginButton} ${styles.twitchLogin}`} onClick={() => {
                    const url = `/api/auth/login?redirect_uri=${encodeURIComponent(`/account`)}`;
                    console.log(url)
                    sessionStorage.clear()
                    localStorage.removeItem('auth')
                    window.location.href = url
                }}>
                    Login with Twitch.TV
                </button>
                <div>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => {
                        localStorage.setItem('saveTokens', e.target.checked ? 'true' : 'false')
                        setRememberMe(e.target.checked)
                    }}/>
                    <span>
                        Remember Me
                    </span>
                </div>
            </main>
        </>
    )
}

// This gets called on every request
export async function getServerSideProps() {
    // Fetch data from external API


    // Pass data to the page via props
    return {props: {
        NOITA_APP_REDIRECT_URI: process.env.NOITA_APP_REDIRECT_URI
    }}
}