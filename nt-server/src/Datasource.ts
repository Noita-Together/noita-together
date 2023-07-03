import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "@/src/entity/User"
import {PendingConnection} from "@/src/entity/PendingConnection";

const userDataSource = new DataSource({
    type: "sqlite",
    database: "Users",
    entities: [User],
    synchronize: true,
    logging: false,
})

const pendingUsersDatasource = new DataSource({
    type: "sqlite",
    database: "pendingUserConnections",
    entities: [PendingConnection],
    synchronize: true,
    logging: false,
})

const UserDatasource = (): Promise<null|DataSource> => {
    return (userDataSource as DataSource).initialize()
        .catch((error) => {
            console.log(error)
            return Promise.resolve(null)
        })
}

const PendingConnectionDatasource = (): Promise<null|DataSource> => {
    return (pendingUsersDatasource as DataSource).initialize()
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