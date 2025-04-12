import nodeSchedule from "node-schedule";
import {Moment} from "moment";

export class ScheduleJobs {
    private scheduleJobs;
    private countJobs: number;

    constructor() {
        this.countJobs = 0;
        this.scheduleJobs = new Map();
    }

    addJob(date: Moment, func: any, jobId?: number): number {
        const job = nodeSchedule.scheduleJob(date.toDate(), func);
        jobId = jobId === undefined ? this.countJobs : jobId;
        this.scheduleJobs.set(jobId, job);
        this.countJobs++;
        return jobId;
    }

    deleteJob(jobId: number) {
        this.scheduleJobs.delete(jobId);
    }
}

const scheduleJobs = new ScheduleJobs();

export {scheduleJobs};
