import { HTTPCodes, HTTPMethod, RequestContext } from '../WebDAVRequest'
import { ResourceType } from '../../../manager/v2/fileSystem/CommonTypes'
import { Errors } from '../../../Errors'

export default class implements HTTPMethod
{
    unchunked(ctx : RequestContext, data : Buffer, callback : () => void) : void
    {
        ctx.noBodyExpected(() => {
            ctx.getResource((e, r) => {
                const targetSource = ctx.headers.isSource;

                ctx.checkIfHeader(r, () => {
                    //ctx.requirePrivilege(targetSource ? [ 'canRead', 'canSource', 'canGetMimeType' ] : [ 'canRead', 'canGetMimeType' ], r, () => {
                        r.type((e, type) => {
                            if(e)
                            {
                                ctx.setCode(e === Errors.ResourceNotFound ? HTTPCodes.NotFound : HTTPCodes.InternalServerError);
                                return callback();
                            }
                            if(!type.isFile)
                            {
                                ctx.setCode(HTTPCodes.MethodNotAllowed)
                                return callback();
                            }
                            
                            r.mimeType(targetSource, (e, mimeType) => process.nextTick(() => {
                                if(e)
                                {
                                    ctx.setCode(e === Errors.ResourceNotFound ? HTTPCodes.NotFound : HTTPCodes.InternalServerError);
                                    return callback();
                                }

                                r.size(targetSource, (e, size) => {
                                    if(e)
                                        ctx.setCode(e === Errors.ResourceNotFound ? HTTPCodes.NotFound : HTTPCodes.InternalServerError);
                                    else
                                    {
                                        ctx.setCode(HTTPCodes.OK);
                                        ctx.response.setHeader('Accept-Ranges', 'bytes')
                                        ctx.response.setHeader('Content-Type', mimeType);
                                        ctx.response.setHeader('Content-Length', size.toString());
                                    }
                                    callback();
                                })
                            }))
                        })
                    //})
                })
            })
        })
    }
    
    isValidFor(type : ResourceType)
    {
        return type && type.isFile;
    }
}