

这个API主要的功能是：根据填写的表单内容，返回推荐的高考院校专业组及专业组内的专业。

根据API的输入，生成查询条件components

我希望能够，在输入基本的信息：province、subjects，rank，score后，就能查询【默认1 稳 策略】，当然用户也可以筛选信息。

其中
* college_type，为多选，可以平铺展示给用户，分类三个类别

    | **分类维度**       | **具体类别** |
    |--------|---|
    | **办学类型**       | 公办、民办、军事、研究生院、保研、本科、省部共建、部委院校、省属、省重点、国家重点  |
    | **院校特色**       | 985、211、双一流、101计划、C9、E9、两电一邮、国防七子、建筑老八校、建筑新八校、八大美院、五院四系 |
    | **院校类型**       | 综合、理工、师范、财经、医药、农林、语言、政法、体育、民族、艺术 |

* province， 目前仅可选：湖北
* rank，当用户输入分数时候，自动生成，用户也可以自己改
* subjects，总共六门，物理、化学、生物、政治、历史、地理，用户必选3门，并且必须选择 物理或者历史
* strategy，[0冲、1稳、2保]，默认1稳
* citys，前端应该有两个下拉框，第一个是省份类似【湖北】，第二个是城市例如【武汉市】
* min_score，max_score，使用一个ratio，可以调整一个范围。默认以用户分数为中心，上下20分

```typescript
export interface ApifoxModel {
    /**
     * 选择城市，使用逗号分隔（不选择省份，仅选择城市）
     */
    citys?: string;
    /**
     * 院校类型，使用逗号分隔，办学类型（公办），院校特色（211），院校类型（综合类），取交集
     */
    college_type?: string;
    /**
     * 招生计划，使用逗号分隔
     */
    enrollment_plan?: string;
    /**
     * 限制搜索最高分
     */
    max_score?: string;
    /**
     * 限制搜索最低分
     */
    min_score?: string;
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
     * 分数
     */
    score?: number;
    /**
     * [0冲、1稳、2保]，默认1稳
     */
    strategy?: number;
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
 */
export interface Request {
    /**
     * 响应码
     */
    code: number;
    data: Data;
    /**
     * 响应消息
     */
    msg: string;
    [property: string]: any;
}

export interface Data {
    list: List[];
    /**
     * 页码
     */
    page: number;
    /**
     * 页面总数
     */
    page_num: number;
    /**
     * 页面大小
     */
    page_size: number;
    /**
     * 总数目
     */
    total: number;
    [property: string]: any;
}

export interface List {
    /**
     * 院校类型，综合大学、医药大学等
     */
    category: string[];
    /**
     * 专业组，可填专业组
     */
    major_group: MajorGroup[];
    /**
     * 院校所在省
     */
    province: string;
    /**
     * 院校代码
     */
    recruit_code: string;
    /**
     * 院校标签，例如985、211等
     */
    tags: string[];
    /**
     * 大学名称
     */
    university_name: string;
    [property: string]: any;
}

export interface MajorGroup {
    /**
     * 专业组代码
     */
    group_code: string;
    /**
     * 组最低排名
     */
    group_min_rank: number;
    /**
     * 组最低分
     */
    group_min_score: number;
    /**
     * 专业，专业组内全部专业
     */
    major: Major[];
    /**
     * 专业组概率，百分比
     */
    probability: number;
    /**
     * 策略，[0冲、1稳、2保]
     */
    strategy: number;
    [property: string]: any;
}

export interface Major {
    /**
     * 专业代码
     */
    code: string;
    /**
     * 专业id，ID 编号
     */
    id: number;
    /**
     * 录取最低位次
     */
    min_rank: number;
    /**
     * 录取最低分
     */
    min_score: number;
    /**
     * 专业名称
     */
    name: string;
    /**
     * 计划数
     */
    plan_num: string;
    /**
     * 录取概率，百分比
     */
    probability: number;
    /**
     * 备注，专业的备注信息
     */
    remark: string;
    /**
     * 策略
     */
    strategy: number;
    /**
     * 学费
     */
    study_cost: string;
    /**
     * 学制
     */
    study_year: string;
    /**
     * 信息年份
     */
    year: string;
    [property: string]: any;
}
```