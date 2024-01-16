import {UserDatasource} from "./Datasource";
import {defaultRoles, User} from "@/entity/User";

const run = async() => {
    const db = await UserDatasource()
    if(!db) return
    let repository = db.getRepository(User)
    let user = new User('test', 'SkyeOfBreeze', defaultRoles, 'local')
    await repository.save(user)
    const userFound = await repository.findOneBy({
        id: 'test'
    })
    console.log(userFound)
}
run()
