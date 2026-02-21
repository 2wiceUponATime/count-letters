type Extends<T, U extends T> = U;

export const templates = {
    welcome: "Heya, welcome! please have a read of the canvas to see <https://hackclub.enterprise.slack.com/docs/T0266FRGM/F0AEE6411E0|How this works> and other FAQ!",
    wrong: "thats the wrong number my little hack clubber. It should be {{correction}}.",
    twice: "you cant count twice in a row. wait. :waiting-pigeon:",
    dailyTmw: "Daily report coming tomorrow",
    daily: "Today, we went from {{lastDailyCountString}} ({{lastDailyCount}}) to {{numberString}} ({{number}}). That's a total of +{{difference}}.",
    noProgress: "No progress today :(",
    noPerm: "You don't have permissions to do that, minion.",
    numberSet: "<@{{userId}}> set the next number to {{text}}."
} as const satisfies Record<string, string>;

export type Templates = typeof templates;

export type TemplateParams = Extends<
    Partial<Record<keyof typeof templates, string[]>>,
    {
        wrong: ["correction"];
        daily: ["lastDailyCountString", "lastDailyCount", "numberString", "number", "difference"];
        numberSet: ["userId", "text"];
    }
>

export type ParamsFor<T extends keyof Templates> =
    TemplateParams extends { [K in T]: string[] }
        ? {
            [K in TemplateParams[T][number]]: string | number
        }
        : Record<string, never>