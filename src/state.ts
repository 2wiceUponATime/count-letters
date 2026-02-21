const keyTypes = {
    number: "number",
    lastCounter: "nullableString",
    lastDailyCount: "number",
} as const;
type KeyTypes = typeof keyTypes;

type TypeMap = {
    number: number;
    nullableString: string | null;
}

export type StateObject = {
    -readonly [K in keyof KeyTypes]: TypeMap[KeyTypes[K]]
};

export class State {
    db: KVNamespace;

    constructor(db: KVNamespace) {
        this.db = db;
    }

    async getObject() {
        const result = await this.db
            .get<Partial<StateObject>>("state", "json");
        return result ?? {}
    }

    async putObject(value: Partial<StateObject>) {
        return this.db.put("state", JSON.stringify(value))
    }

    async updateObject(value: Partial<StateObject>) {
        return this.putObject({
            ...await this.getObject(),
            ...value,
        });
    }

    async get<T extends keyof StateObject>(
        key: T
    ): Promise<StateObject[T] | null> {
        const object = await this.getObject();
        return object[key] ?? null;
    }

    async put<T extends keyof StateObject>(
        key: T,
        value: StateObject[T]
    ) {
        const object = await this.getObject();
        object[key] = value;
        await this.putObject(object);
    }
}