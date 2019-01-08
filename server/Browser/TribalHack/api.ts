import { Router } from "express";


export class TribalHackApi {

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            let data = {
                servers: [
                    { key: 'de', value: 'Deutschland', maps: ["161", "162", "163"] },
                    { key: 'ch', value: 'Schweiz', maps: ["165", "166", "167"] },
                    { key: 'us', value: 'Amerika', maps: ["169", "122", "113"] }
                ],
                effects: [
                    {
                        name: 'auto-palladin',
                        description: 'automaticly levels up the palladin if there are enought recourses',
                        price: 8,
                        author: 'AboX',
                        verified: true,
                        maps: [
                            { server: 'de', map: '161' },
                            { server: 'de', map: '163' }
                        ],
                        settings: {}
                    },
                    {
                        name: 'crash-protection',
                        description: 'checks if the script got disconnected from the game server',
                        price: 8,
                        author: 'AboX',
                        verified: true,
                        settings: {
                            actionOnCrash: ['reload', 'restart', 'notify', 'reload and notify', 'restart and notify']
                        }
                    },
                ]
            }

            return res.json(data);
        });

        return router;
    }
}