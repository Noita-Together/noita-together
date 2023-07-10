import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entity/User"
import {PendingConnection} from "../entity/PendingConnection";

const userDataSource = new DataSource({
    type: "sqlite",
    database: "user.sqlite",
    entities: [User],
    synchronize: true,
    logging: false,
})

const pendingUsersDatasource = new DataSource({
    type: "sqlite",
    database: "pendingUserConnections.sqlite",
    entities: [PendingConnection],
    synchronize: true,
    logging: false,
})
const userDataSourceConnection = userDataSource.initialize()
const pendingUsersDatasourceConnection = pendingUsersDatasource.initialize()

const UserDatasource = (): Promise<null|DataSource> => {
    return userDataSourceConnection
        .catch((error) => {
            console.log(error)
            return Promise.resolve(null)
        })
}

const PendingConnectionDatasource = (): Promise<null|DataSource> => {
    return pendingUsersDatasourceConnection
        .catch((error) => {
            console.log(error)
            return Promise.resolve(null)
        })
}

// to initialize initial connection with the database, register all entities
// and "synchronize" database schema, call "initialize()" method of a newly created database
// once in your application bootstrap

export {
    UserDatasource,
    PendingConnectionDatasource
}