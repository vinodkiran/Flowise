import express from 'express'
import { NodesPool } from '../NodesPool'
import { getInstance } from '../index'
import { DataSource } from 'typeorm'
import { ChatflowPool } from '../ChatflowPool'
import { CachePool } from '../CachePool'
import multer from 'multer'

export abstract class AbstractRoutes {
    protected readonly app: express.Application
    private _uploads: multer.Multer

    protected constructor(app: express.Application) {
        this.app = app
    }

    get nodesPool(): NodesPool {
        return <NodesPool>getInstance()?.nodesPool
    }

    get chatflowPool(): ChatflowPool {
        return <ChatflowPool>getInstance()?.chatflowPool
    }

    get cachePool(): CachePool {
        return <CachePool>getInstance()?.cachePool
    }

    get AppDataSource(): DataSource {
        return <DataSource>getInstance()?.AppDataSource
    }

    get uploads(): multer.Multer {
        return this._uploads
    }

    set uploads(value: multer.Multer) {
        this._uploads = value
    }

    abstract configureRoutes(): void
}
