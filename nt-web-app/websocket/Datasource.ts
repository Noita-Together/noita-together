import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entity/User"
import {PendingConnection} from "../entity/PendingConnection";
// import {RoomStats, UserStats, EnemyKillCount, ItemPickupEvent, SessionStats} from "../entity/RunStatistics";

const userDataSource = new DataSource({
    database: process.env.DATABASE_NAME,
    ssl: (!process.env.DATABASE_CA_CERT ? false : { ca: process.env.DATABASE_CA_CERT }),
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_SECRET,
    username: process.env.DATABASE_USERNAME,
    port: parseInt(process.env.DATABASE_PORT ?? "0"),
    entities: [User, PendingConnection],
    logging: false,
})

//TODO we need to make this create itself in postgres
// const roomStatsDatasource = new DataSource({
//     type: "postgres",
//     host: process.env.DATABASE_HOST,
//     password: process.env.DATABASE_SECRET,
//     username: process.env.DATABASE_USERNAME,
//     port: parseInt(process.env.DATABASE_PORT ?? "0"),
//     entities: [RoomStats, UserStats, EnemyKillCount, ItemPickupEvent, SessionStats],
//     logging: false,
// })

const userDataSourceConnection = userDataSource.initialize()
// const roomStatsDatasourceConnection = roomStatsDatasource.initialize()

const UserDatasource = (): Promise<null|DataSource> => {
    return userDataSourceConnection
        .catch((error) => {
            console.log(error)
            return Promise.resolve(null)
        })
}

const RoomStatsDatasource = (): Promise<null|DataSource> => {
    return Promise.resolve(null)
    // return roomStatsDatasourceConnection
    //     .catch((error) => {
    //         console.log(error)
    //         return Promise.resolve(null)
    //     })
}

const initDBs = async ()=> {
    await userDataSource.initialize()
    await userDataSource.synchronize(true)
}

// to initialize initial connection with the database, register all entities
// and "synchronize" database schema, call "initialize()" method of a newly created database
// once in your application bootstrap

export {
    UserDatasource,
    RoomStatsDatasource,
    initDBs
}