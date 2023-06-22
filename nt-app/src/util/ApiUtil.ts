export type Environment = 'production'|'dev'|"lan"

class ApiUtil{
    environment: Environment = "production"
    lanIP: string|null = null

    getWSUrl(){
        console.log(`getWSUrl: ${this.getUrls().ws}`)
        return this.getUrls().ws
    }

    getApiUrl(){
        return this.getUrls().api
    }

    getWebpageUrl(){
        return this.getUrls().website
    }

    setEnvironment(environment: Environment){
        this.environment = environment
    }

    setLanIp(ip: string|null){
        this.lanIP = ip
    }

    private getUrls(){
        switch (this.environment){
            case "production":
                return {
                    ws: `ws://${process.env.VITE_APP_HOSTNAME_PUBLIC}${process.env.VITE_APP_WS_PORT_PUBLIC}/`,
                    website: `https://${process.env.VITE_APP_HOSTNAME_PUBLIC}`,
                    api: `https://${process.env.VITE_APP_HOSTNAME_PUBLIC}/api`
                }
            case "dev":
                return {
                    ws: `ws://localhost:5466`,
                    website: `http://localhost:3000`,
                    api: `http://localhost:3000/api`
                }
            case "lan":
                return {
                    ws: `ws://${this.lanIP}:5466`,
                    website: `http://${this.lanIP}:3000`,
                    api: `htttp://${this.lanIP}/api`
                }
        }
    }
}

const globalAPI = new ApiUtil()

export {
    ApiUtil,
    globalAPI
}