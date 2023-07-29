import Head from 'next/head'
import {Inter} from 'next/font/google'
import styles from '../../../../../styles/Stats.module.css'

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
                                <td>{user.username}</td>
                                <td>{user.hearts}</td>
                                <td>{user.orbs}</td>
                                <td>{user.deaths}</td>
                                <td>{user.wins}</td>
                                <td>{user.steve_kills}</td>
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
import {RoomStatsDatasource} from "../../../../../websocket/Datasource";
import {RoomStats, SessionStats, UserStats} from "../../../../../entity/RunStatistics";
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
    sessionStats?: string
    aggregateData?: string
}

const generateReturnObject = (repo: Repo) => {
    return {props: {repo}}
}

export interface StatsParams {
    session_id: string,
    room_id: string,

    [key: string]: string | undefined | string[]
}

export const getServerSideProps: GetServerSideProps<{
    repo?: Repo
}, StatsParams> = async ({params}) => {
    try {
        if (params?.session_id === 'demo') {
            return Promise.resolve(generateReturnObject(generateSampleData()))
        }
        const [db] = await Promise.all([RoomStatsDatasource()])
        if (!db)
            return generateReturnObject({isValid: false, error: 'db init failure', code: 500})
        if (!params || !params.room_id || typeof params.room_id !== 'string')
            return generateReturnObject({isValid: false, error: 'params malformed. Expected string room_id', code: 400})
        const {room_id, session_id} = params
        //do a little sanitizing
        const uuidV4Regex = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
        if (!uuidV4Regex.test(room_id))
            return generateReturnObject({isValid: false, error: 'invalid room id'})
        if (!uuidV4Regex.test(session_id))
            return generateReturnObject({isValid: false, error: 'invalid session id'})

        const roomRepo = db.getRepository(RoomStats)
        const sessionRepo = db.getRepository(SessionStats)
        const userStatsRepo = db.getRepository(UserStats)
        const [room, session, userStats, aggregatedData] = await Promise.all([
            roomRepo.findOneBy({
                room_id: room_id
            }), sessionRepo.findOneBy({
                session_id: session_id
            }), userStatsRepo.findBy({
                session_id: session_id
            }), userStatsRepo.query(
                'SELECT sum(hearts),sum(deaths),sum(wins),sum(orbs) FROM userStats WHERE session_id LIKE ${session_id}'
            )
        ])

        if (!room)
            return generateReturnObject({isValid: false, error: 'room not found :(', code: 404})
        if (!session)
            return generateReturnObject({isValid: false, error: 'session not found :(', code: 404})
        if (!userStats)
            return generateReturnObject({isValid: false, error: 'stats for room not found :(', code: 404})
        if (!aggregatedData)
            return generateReturnObject({isValid: false, error: 'stats for room not found :(', code: 500})

        const repo: Repo = {
            isValid: true,
            roomData: JSON.stringify(room),
            sessionStats: JSON.stringify(session),
            userStats: JSON.stringify(userStats),
            aggregateData: JSON.stringify(aggregatedData as SummedData)
        }

        return {props: {repo}}
    } catch (e: any) {
        return generateReturnObject({isValid: false, error: e?.message ?? e, code: 500})
    }
}

const generateSampleData = (): Repo => {
    const roomStats = new RoomStats("SkyeOfBreeze's Room", 'SkyeOfBreeze', 'demo')
    const sessionStats = new SessionStats('SkyeOfBreeze',  true)
    const userStats = [
        new UserStats('demo', '1', 'demo_user_1',false, 1, 2, 1, 1, 3),
        new UserStats('demo', '2', 'demo_user_2',false, 1, 2, 2, 1, 3),
        new UserStats('demo', '3', 'demo_user_3',false, 1, 2, 0, 1, 3),
        new UserStats('demo', '4', 'demo_user_4',false, 2, 0, 0, 0, 1),
        new UserStats('demo', '5', 'demo_user_5',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '6', 'demo_user_6',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '7', 'demo_user_7',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '8', 'demo_user_8',false, 1, 2, 5, 1, 0),
        new UserStats('demo', '9', 'demo_user_9',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '10', 'demo_user_10',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '11', 'demo_user_11',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '12', 'demo_user_12',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '13', 'demo_user_13',false, 1, 2, 6, 1, 0),
        new UserStats('demo', '14', 'demo_user_14',false, 5, 2, 0, 1, 0),
        new UserStats('demo', '15', 'demo_user_15',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '16', 'demo_user_16',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '17', 'demo_user_17',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '18', 'demo_user_18',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '19', 'demo_user_19',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '20', 'demo_user_20',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '21', 'demo_user_21',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '22', 'demo_user_22',false, 1, 2, 0, 1, 0),
        new UserStats('demo', '23', 'demo_user_23',false, 1, 2, 0, 1, 0),
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
            return userStat.steve_kills ? prevValue + 1 : prevValue
        }, 0)
    }

    return {
        isValid: true,
        roomData: JSON.stringify(roomStats),
        sessionStats: JSON.stringify(sessionStats),
        userStats: JSON.stringify(userStats),
        aggregateData: JSON.stringify(aggregateData)
    }
}

