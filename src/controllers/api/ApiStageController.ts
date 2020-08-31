import { Route, Tags, Security, Request, Post, Path, Delete } from "tsoa";
import { Request as exRequest } from "express";
import ApplicationError from "../../ApplicationError";
import { Stage, StageStatus } from "../../entity/manager/Stage";
import { getRepository, getManager } from 'typeorm';

@Route('/api/stages')
@Tags('Stage')
export class ApiStageController {
  
  @Post('/{id}/deploy')
  @Security('jwt')
  public async deploy(
    @Request() request: exRequest,
    @Path('id') id: number
  ): Promise<Stage> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOneOrFail({
      relations:['application'],
      where: {
        id: id
      }
    })

    if(stage.application.userId !== request.user.id) throw new ApplicationError(404, 'Not Found');
    if(stage.status !== StageStatus.LOADED) throw new ApplicationError(400, 'Bad Request')
    stage.status = StageStatus.DEPLOYED;
    await stageRepo.save(stage);

    return Promise.resolve(stage);
  }

  @Post('/{id}/undeploy')
  @Security('jwt')
  public async undeploy(
    @Request() request: exRequest,
    @Path('id') id: number
  ): Promise<Stage> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOneOrFail({
      relations:['application'],
      where: {
        id: id
      }
    })

    if(stage.application.userId !== request.user.id) throw new ApplicationError(404, 'Not Found');
    if(stage.status !== StageStatus.DEPLOYED) throw new ApplicationError(400, 'Bad Request');

    stage.status = StageStatus.LOADED;
    await stageRepo.save(stage);

    return Promise.resolve(stage);
  }

  @Delete('/{id}')
  @Security('jwt')
  public async delete(
    @Request() request: exRequest,
    @Path('id') id: number
  ): Promise<any> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOneOrFail({
      relations:['application', 'services'],
      where: {
        id: id
      }
    })

    if(stage.application.userId !== request.user.id) throw new ApplicationError(404, 'Not Found');
    if(stage.status === StageStatus.DEPLOYED) throw new ApplicationError(400, 'Bad Request');
    await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
      await transactionalEntityManager.remove(stage.services);
      await transactionalEntityManager.remove(stage);
    })
    stage.id = id;
    
    return Promise.resolve(stage);
  }
}