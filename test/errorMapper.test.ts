import { mapErrors } from "../util/errorMapper.js";
import { describe, it } from "mocha";
import { expect } from "chai";

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
})