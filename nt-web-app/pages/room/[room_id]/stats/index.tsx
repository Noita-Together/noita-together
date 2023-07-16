import Head from 'next/head'
import {Inter} from 'next/font/google'
import styles from '../../../../styles/Stats.module.css'

const inter = Inter({subsets: ['latin']})

export default function Stats({
                                  repo,
                              }: InferGetServerSidePropsType<typeof getServerSideProps>) {


    const roomData: RoomStats | undefined = useMemo(() => repo?.roomData && JSON.parse(repo.roomData), [repo])
    const userStats: UserStats[] | undefined = useMemo(() => repo?.userStats && JSON.parse(repo.userStats), [repo])
    const aggregateData: SummedData | undefined = useMemo(() => repo?.aggregateData && JSON.parse(repo.aggregateData), [repo])

    if (!repo || !repo.isValid) {
        return <>
            <Head>
                <title>Noita together stats</title>
                <meta name="description" content="Play alone together"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className={`${inter.className}`}>
                {repo?.code} {repo?.error ?? "Unknown Error Occurred"}
            </main>
        </>
    }

    return (
        <>
            <Head>
                <title>Noita together stats</title>
                <meta name="description" content="Play alone together"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className={`${styles.main}`}>
                <div className={styles.title}>Server Stats for {roomData?.room_name ?? '??'}</div>
                <div className={styles.subtitle}>Run Summary</div>
                <table className={styles.summary}>
                    <tbody>
                    <tr>
                        <th>Users</th>
                        <th>Hearts</th>
                        <th>Orbs</th>
                        <th>Deaths</th>
                        <th>Wins</th>
                        <th>Steve?</th>
                    </tr>
                    <tr>
                        <td>{userStats?.length ?? '--'}</td>
                        <td>{aggregateData?.hearts ?? '--'}</td>
                        <td>{aggregateData?.orbs ?? '--'}</td>
                        <td>{aggregateData?.deaths ?? '--'}</td>
                        <td>{aggregateData?.wins ?? '--'}</td>
                        <td>{aggregateData?.steve ?? '--'}</td>
                    </tr>
                    </tbody>
                </table>
                <div className={styles.statsContainer}>
                    <table className={styles.stats}>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Hearts</th>
                            <th>Orbs</th>
                            <th>Deaths</th>
                            <th>Wins</th>
                            <th>Steve?</th>
                        </tr>
                        </thead>
                        <tbody className={styles.statsBody}>
                        {userStats?.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.hearts}</td>
                                <td>{user.orbs}</td>
                                <td>{user.deaths}</td>
                                <td>{user.wins}</td>
                                <td>{user.triggered_steve ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </>
    )
}

import type {InferGetServerSidePropsType, GetServerSideProps} from 'next'
import {RoomStatsDatasource} from "../../../../websocket/Datasource";
import {RoomStats, UserStats} from "../../../../entity/RunStatistics";
import React, {useMemo} from "react";

type SummedData = {
    hearts?: number,
    orbs?: number,
    deaths?: number,
    wins?: number,
    steve?: number
}

type Repo = {
    isValid: boolean
    error?: string
    code?: number
    roomData?: string
    userStats?: string
    aggregateData?: string
}

const generateReturnObject = (repo: Repo) => {
    return {props: {repo}}
}

export const getServerSideProps: GetServerSideProps<{
    repo?: Repo
}> = async ({params}) => {
    try {
        if (params?.room_id === 'demo') {
            return Promise.resolve(generateReturnObject(generateSampleData()))
        }
        const db = await RoomStatsDatasource()
        if (!db)
            return generateReturnObject({isValid: false, error: 'db init failure', code: 500})
        if (!params || !params.room_id || typeof params.room_id !== 'string')
            return generateReturnObject({isValid: false, error: 'params malformed. Expected string room_id', code: 400})
        const {room_id} = params
        //do a little sanitizing
        const uuidV4Regex = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
        if (!uuidV4Regex.test(room_id))
            return generateReturnObject({isValid: false, error: 'invalid room id'})

        const roomRepo = db.getRepository(RoomStats)
        const room = await roomRepo.findOneBy({
            room_id: room_id
        })
        if (!room)
            return generateReturnObject({isValid: false, error: 'room not found :(', code: 404})
        const userStatsRepo = db.getRepository(UserStats)
        const userStats = await userStatsRepo.findBy({
            room_id: room_id
        })
        if (!userStats)
            return generateReturnObject({isValid: false, error: 'stats for room not found :(', code: 404})
        const aggregatedData = await userStatsRepo.query('SELECT sum(hearts),sum(deaths),sum(wins),sum(orbs) FROM userStats WHERE room_id LIKE ${room_id}')

        const repo: Repo = {
            isValid: true,
            roomData: JSON.stringify(room),
            userStats: JSON.stringify(userStats),
            aggregateData: JSON.stringify(aggregatedData as SummedData)
        }

        return {props: {repo}}
    } catch (e: any) {
        return generateReturnObject({isValid: false, error: e?.message ?? e, code: 500})
    }
}

const generateSampleData = (): Repo => {
    const roomStats = new RoomStats('demo', 'Example', 'SkyeOfBreeze', '1', true)
    const userStats = [
        new UserStats('demo', '1', false, 1, 2, true, 1, 3),
        new UserStats('demo', '1', false, 1, 2, true, 1, 3),
        new UserStats('demo', '1', false, 1, 2, true, 1, 3),
        new UserStats('demo', '2', false, 2, 0, false, 0, 1),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
        new UserStats('demo', '3', false, 1, 2, false, 1, 0),
    ]
    const aggregateData: SummedData = {
        hearts: userStats.reduce((prevValue, userStat) => {
            return userStat.hearts + prevValue
        }, 0),
        orbs: userStats.reduce((prevValue, userStat) => {
            return userStat.orbs + prevValue
        }, 0),
        wins: userStats.reduce((prevValue, userStat) => {
            return userStat.wins + prevValue
        }, 0),
        deaths: userStats.reduce((prevValue, userStat) => {
            return userStat.deaths + prevValue
        }, 0),
        steve: userStats.reduce((prevValue, userStat) => {
            return userStat.triggered_steve ? prevValue + 1 : prevValue
        }, 0)
    }

    return {
        isValid: true,
        roomData: JSON.stringify(roomStats),
        userStats: JSON.stringify(userStats),
        aggregateData: JSON.stringify(aggregateData)
    }
}

