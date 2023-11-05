import React, {useEffect, useState} from 'react'
import Head from 'next/head'
import Image from 'next/image'
import {Button, Collapse, SlideFade, Spinner} from '@chakra-ui/react'
import {Flex, Text} from '@chakra-ui/react'
import {DarkModeSwitch} from '../components/DarkModeSwitch'
import {ServerConfig} from "../../main/background";

export default function HomePage() {

    const [isLoading, setLoading] = useState(true)
    const [isLoggingIn, setLoggingIn] = useState(false)
    const [showLoginButton, setShowLoginButton] = useState(false)
    // useEffect(() => {
    //     const time = setTimeout(() => {
    //         setShowLoginButton(true)
    //         setLoading(false)
    //     }, 1000)
    //     return () => clearTimeout(time)
    // }, [])

    const [messages, setMessages] = React.useState('')
    React.useEffect(() => {
        window.ipc.on('login-event', (messages: string) => {
            console.log(`We got a login event of ${messages}`)
            setMessages(messages)
        })
        window.ipc.on('configuration', (configuration: ServerConfig) => {
            setShowLoginButton(true)
            setLoading(false)
        })
    }, [])

    return (
        <React.Fragment>
            <Head>
                <title>Noita Together</title>
            </Head>
            <Flex
                bg="gray.50"
                color="black"
                _dark={{
                    bg: 'gray.900',
                    color: 'white',
                }}
                transition="all 1s ease-out ease-in"
                gap={4}
                minHeight="100vh"
                alignItems="center"
                justify="center"
                direction="column">
                <DarkModeSwitch/>
                <Image
                    src="/images/logo.png"
                    alt="Logo image"
                    width={200}
                    height={200}
                />
                {/*https://chakra-ui.com/docs/styled-system/style-props*/}
                <Text fontSize={32}>
                    Noita Together
                </Text>
                <Text>
                    {messages}
                </Text>
                <SlideFade in={isLoading}>
                    <Spinner color="orange.500" size="xl" thickness='6px'/>
                </SlideFade>
                <Collapse in={showLoginButton} animateOpacity>
                    <Button bg="#6441a5" isLoading={isLoggingIn} color="white" loadingText='logging in with browser' title="(dummy button)" onClick={() => {
                        setShowLoginButton(true)
                        window.ipc.beginTwitchLogin(false)
                    }}>Login with Twitch</Button>
                </Collapse>
            </Flex>
        </React.Fragment>
    )
}
