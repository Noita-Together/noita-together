import dotenv from "dotenv";
dotenv.config();
import {initDBs} from './websocket/Datasource'

const init = async ()=> {
    console.log('Initializing DB')
    await initDBs()
    console.log('Initialized DB')
}

init()
