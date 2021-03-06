import {AxiosError, AxiosResponse} from "axios";

function hasProp<O extends unknown, K extends PropertyKey>(
    obj: O, propKey: K
): obj is O & { [key in K]: unknown } {
    return propKey in obj;
}

export function checkAxiosError<T>(e: unknown): asserts e is (AxiosError<T> & {response: AxiosResponse<T>}) {
    if (!hasProp(e, "isAxiosError") || !e.isAxiosError) {
        throw e;
    }
    const response = (e as AxiosError).response;
    if (typeof response === "undefined") {
        throw e;
    }
}
