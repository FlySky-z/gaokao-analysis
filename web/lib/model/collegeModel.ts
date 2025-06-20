export interface GetReportRequest {
    /**
     * 物理、化学、生物、政治、历史、地理
     * 1          2         3        4        5         6
     * 物理、化学、生物
     * "123"
     */
    class_comb: string;
    page: string;
    page_size: string;
    province: string;
    rank: number;
}


export interface GetReportResponse {
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
}

export interface Conf {
    page: number;
    page_size: number;
    total_number: number;
    total_page: number;
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
}
