
API地址为：/api/voluntary/majorGroup

这个API主要的功能是： 根据给出的school_code，返回专业组内的具体专业。

根据API的输入，用于在 专业优先里面，查看专业所在的专业组内具体专业。

我希望能够，在输入基本的信息：group_code、province，school_code，score，subjects后，就能查询。

其中

* province， 目前仅可选：湖北
* rank，用户位次
* subjects，总共六门，物理、化学、生物、政治、历史、地理，用户必选3门，并且必须选择 物理或者历史，格式类似：物理,历史,生物

```typescript
/**
 * Request
 *
 * models.VoluntaryMajorGroupRequest
 */
export interface Request {
    /**
     * 专业组代码
     */
    group_code?: string;
    /**
     * 档案id
     */
    profile_id?: string;
    /**
     * 报考的省份
     */
    province?: string;
    /**
     * 排名
     */
    rank?: number;
    /**
     * 院校代码
     */
    school_code?: string;
    /**
     * 分数
     */
    score?: number;
    /**
     * 用户选择的科目
     */
    subjects?: string;
    [property: string]: any;
}
```

API将返回下面的信息：
```typescript
/**
 * Request
 *
 * models.VoluntaryMajorGroupResponse
 */
export interface Request {
    /**
     * 响应码
     */
    code?: number;
    data?: ModelsVoluntaryMajorGroup;
    /**
     * 响应消息
     */
    msg?: string;
    [property: string]: any;
}

/**
 * models.VoluntaryMajorGroup
 */
export interface ModelsVoluntaryMajorGroup {
    /**
     * 专业组代码
     */
    group_code?: string;
    /**
     * 专业，专业组内全部专业
     */
    major?: ModelsVoluntaryMajor[];
    /**
     * 专业组概率，百分比
     */
    probability?: number;
    /**
     * 策略，[0冲、1稳、2保]
     */
    strategy?: number;
    [property: string]: any;
}

/**
 * models.VoluntaryMajor
 */
export interface ModelsVoluntaryMajor {
    /**
     * 专业代码
     */
    code?: string;
    /**
     * 专业id，ID 编号
     */
    id?: number;
    /**
     * 录取最低位次
     */
    min_rank?: number;
    /**
     * 录取最低分
     */
    min_score?: number;
    /**
     * 专业名称
     */
    name?: string;
    /**
     * 计划数
     */
    plan_num?: string;
    /**
     * 录取概率，百分比
     */
    probability?: number;
    /**
     * 策略
     */
    strategy?: number;
    /**
     * 学费
     */
    study_cost?: string;
    /**
     * 学制
     */
    study_year?: string;
    /**
     * 信息年份
     */
    year?: string;
    [property: string]: any;
}
```