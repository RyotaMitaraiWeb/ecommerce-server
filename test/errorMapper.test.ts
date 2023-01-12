import { mapErrors } from "../util/errorMapper.js";
import { describe, it } from "mocha";
import { expect } from "chai";
import { HttpError } from "../util/HttpError.js";

describe('errorMapper.ts', () => {
    it('Returns the same array when the error is an array', () => {
        try {
            throw ['Error'];
        } catch (err) {
            const error = mapErrors(err);
            expect(error).to.deep.equal(['Error']);
        }
    });

    it('Transforms a standard error into an array', () => {
        try {
            throw Error('Error');
        } catch (err: any) {
            const error = mapErrors(err);
            expect(error).to.deep.equal([{ msg: err.message}])
        }
    });

    it('Ignores status code when an HttpError object is thrown', async () => {
        try {
            throw new HttpError('Error', 400);
        } catch (err: any) {
            const error = mapErrors(err);
            expect(error).to.deep.equal([{ msg: err.message}])
        }
    });
})