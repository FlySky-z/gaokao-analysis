
API地址：/api/report/get

这个API主要的功能是：根据填写的表单内容，返回推荐的专业信息。

根据API的输入，生成查询条件components

我希望能够，在输入基本的信息：rank、class_first_choise，class_optional_choise，provinc后，就能查询【默认1 稳 策略】，

当然用户也可以筛选信息。

其中
* interest，可多选，string，传入结果样式类似：["理科","工科"]，可选类别如下：

    理科 工科 文科（非经管法） 经管法 医科 设计与艺术类 语言类

* province， 目前仅可选：湖北
* strategy，[0冲、1稳、2保]，默认1稳

```typescript
export interface ApifoxModel {
    /**
     * 首选学科，可选：
     * 物理
     * 历史
     */
    class_first_choise: string;
    /**
     * 补充学科，格式为：
     * ["化学","生物"]
     */
    class_optional_choise?: string;
    /**
     * 大学所在地，格式类似：
     * ["湖北"]
     */
    college_location: string;
    /**
     * 意向专业方向 理科    工科    文科（非经管法）    经管法    医科    设计与艺术类    语言类
     * 格式类似：
     * ["理科","工科"]
     */
    interest?: string;
    page: string;
    page_size: string;
    /**
     * 生源地，目前仅限湖北
     */
    province: string;
    rank: number;
    /**
     * 冲稳保策略 0 冲 1 稳 2 保
     */
    strategy?: number;
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
     * 状态码
     */
    code: number;
    /**
     * 数据
     */
    data: Data;
    /**
     * 状态信息
     */
    msg: string;
    [property: string]: any;
}

/**
 * 数据
 */
export interface Data {
    conf?: Conf;
    /**
     * 院校列表
     */
    list: List[];
    [property: string]: any;
}

export interface Conf {
    page: number;
    page_size: number;
    total_number: number;
    total_page: number;
    [property: string]: any;
}

export interface List {
    /**
     * 选科要求
     */
    class_demand?: string;
    /**
     * 院校代码
     */
    colledge_code?: string;
    /**
     * 院校名称
     */
    colledge_name?: string;
    /**
     * 备注
     */
    description?: string;
    /**
     * 自增id，对应表格里的id
     */
    id?: number;
    /**
     * 录取最低分
     */
    lowest_points?: number;
    /**
     * 录取最低位次
     */
    lowest_rank?: number;
    /**
     * 专业名称
     */
    professional_name: string;
    /**
     * 专业组代码
     */
    special_interest_group_code?: string;
    [property: string]: any;
}

```