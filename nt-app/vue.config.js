module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            externals: ["keytar"],
            builderOptions: {
                productName: "Noita Together Beta",
                win: {
                    target: "nsis",
                    requestedExecutionLevel: "requireAdministrator" //eugh
                },
                nsis: {
                    perMachine: true,
                    oneClick: false,
                    allowToChangeInstallationDirectory: true
                },
                publish: ["github"]
            }
        }
    },
    filenameHashing: false
}
