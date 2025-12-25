import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Statistic, Row, Col, DatePicker, message } from 'antd';
import { DownloadOutlined, CarOutlined, NumberOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as XLSX from 'xlsx';
import { useI18n } from '../../i18n/I18nProvider';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

const LorryReport = ({ activeSeason }) => {
  const { t } = useI18n();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs(activeSeason.start_date),
    dayjs(activeSeason.end_date)
  ]);

  useEffect(() => {
    loadPurchases();
  }, [activeSeason, dateRange]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.purchases.getAll({ season_id: activeSeason.season_id });
      if (result.success) {
        let filtered = result.data.filter(p => p.status === 'completed' && p.vehicle_number);
        
        // Apply date filter
        if (dateRange && dateRange[0] && dateRange[1]) {
          filtered = filtered.filter(p => {
            const purchaseDate = dayjs(p.transaction_date);
            return purchaseDate.isSameOrAfter(dateRange[0], 'day') && 
                   purchaseDate.isSameOrBefore(dateRange[1], 'day');
          });
        }
        
        setPurchases(filtered);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      message.error(t('reports.lorry.messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateLorrySummary = () => {
    const lorryMap = {};
    
    purchases.forEach(purchase => {
      const lorryNo = purchase.vehicle_number;
      if (!lorryMap[lorryNo]) {
        lorryMap[lorryNo] = {
          lorry_number: lorryNo,
          frequency: 0,
          cumulative_weight: 0,
          total_amount: 0,
          transactions: []
        };
      }
      
      lorryMap[lorryNo].frequency += 1;
      lorryMap[lorryNo].cumulative_weight += parseFloat(purchase.net_weight_kg || 0);
      lorryMap[lorryNo].total_amount += parseFloat(purchase.total_amount || 0);
      lorryMap[lorryNo].transactions.push({
        date: purchase.transaction_date,
        farmer: purchase.farmer_name,
        weight: parseFloat(purchase.net_weight_kg || 0),
        amount: parseFloat(purchase.total_amount || 0)
      });
    });
    
    // Sort by cumulative weight descending
    return Object.values(lorryMap).sort((a, b) => b.cumulative_weight - a.cumulative_weight);
  };

  const calculateSummary = () => {
    const lorrySummary = calculateLorrySummary();
    const totalLorries = lorrySummary.length;
    const totalTrips = purchases.length;
    const totalWeight = purchases.reduce((sum, p) => sum + parseFloat(p.net_weight_kg || 0), 0);
    const avgWeightPerTrip = totalTrips > 0 ? totalWeight / totalTrips : 0;
    
    return { totalLorries, totalTrips, totalWeight, avgWeightPerTrip };
  };

  const handleDownload = () => {
    try {
      const lorrySummary = calculateLorrySummary();
      const summary = calculateSummary();
      
      // Prepare summary data
      const summaryData = lorrySummary.map(lorry => ({
        [t('reports.lorry.excel.summary.columns.lorryNumber')]: lorry.lorry_number,
        [t('reports.lorry.excel.summary.columns.frequencyTrips')]: lorry.frequency,
        [t('reports.lorry.excel.summary.columns.cumulativeWeightKg')]: lorry.cumulative_weight.toFixed(2),
        [t('reports.lorry.excel.summary.columns.totalAmountPaidRm')]: lorry.total_amount.toFixed(2),
        [t('reports.lorry.excel.summary.columns.avgWeightPerTripKg')]: (lorry.cumulative_weight / lorry.frequency).toFixed(2)
      }));

      // Add overall summary
      summaryData.push({});
      summaryData.push({
        [t('reports.lorry.excel.summary.columns.lorryNumber')]: t('reports.lorry.excel.summary.overallLabel'),
        [t('reports.lorry.excel.summary.columns.frequencyTrips')]: summary.totalTrips,
        [t('reports.lorry.excel.summary.columns.cumulativeWeightKg')]: summary.totalWeight.toFixed(2),
        [t('reports.lorry.excel.summary.columns.totalAmountPaidRm')]: lorrySummary.reduce((sum, l) => sum + l.total_amount, 0).toFixed(2),
        [t('reports.lorry.excel.summary.columns.avgWeightPerTripKg')]: summary.avgWeightPerTrip.toFixed(2)
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, t('reports.lorry.excel.sheets.lorrySummary'));

      // Add detailed transactions for each lorry
      lorrySummary.forEach(lorry => {
        const detailData = lorry.transactions.map(t => ({
          [t('reports.lorry.excel.details.columns.date')]: dayjs(t.date).format('DD/MM/YYYY HH:mm'),
          [t('reports.lorry.excel.details.columns.farmer')]: t.farmer,
          [t('reports.lorry.excel.details.columns.weightKg')]: t.weight.toFixed(2),
          [t('reports.lorry.excel.details.columns.amountRm')]: t.amount.toFixed(2)
        }));
        
        // Add lorry summary at the end
        detailData.push({});
        detailData.push({
          [t('reports.lorry.excel.details.columns.date')]: t('reports.lorry.misc.total'),
          [t('reports.lorry.excel.details.columns.farmer')]: '',
          [t('reports.lorry.excel.details.columns.weightKg')]: lorry.cumulative_weight.toFixed(2),
          [t('reports.lorry.excel.details.columns.amountRm')]: lorry.total_amount.toFixed(2)
        });
        
        const wsDetail = XLSX.utils.json_to_sheet(detailData);
        const sheetName = lorry.lorry_number.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(wb, wsDetail, sheetName);
      });

      // Generate filename
      const filename = `Lorry_Report_${activeSeason.season_name}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, filename);
      message.success(t('reports.lorry.messages.downloaded'));
    } catch (error) {
      console.error('Error downloading report:', error);
      message.error(t('reports.lorry.messages.downloadFailed'));
    }
  };

  const columns = [
    {
      title: t('reports.lorry.columns.lorryNumber'),
      dataIndex: 'lorry_number',
      key: 'lorry_number',
      width: 150,
      sorter: (a, b) => a.lorry_number.localeCompare(b.lorry_number)
    },
    {
      title: t('reports.lorry.columns.frequencyTrips'),
      dataIndex: 'frequency',
      key: 'frequency',
      align: 'right',
      width: 150,
      sorter: (a, b) => a.frequency - b.frequency,
      render: (val) => <strong>{val}</strong>
    },
    {
      title: t('reports.lorry.columns.cumulativeWeightKg'),
      dataIndex: 'cumulative_weight',
      key: 'cumulative_weight',
      align: 'right',
      width: 200,
      sorter: (a, b) => a.cumulative_weight - b.cumulative_weight,
      render: (val) => val.toFixed(2)
    },
    {
      title: t('reports.lorry.columns.totalAmountPaid'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      width: 180,
      render: (val) => `RM ${val.toFixed(2)}`
    },
    {
      title: t('reports.lorry.columns.avgWeightPerTrip'),
      key: 'avg_weight',
      align: 'right',
      width: 150,
      render: (_, record) => `${(record.cumulative_weight / record.frequency).toFixed(2)} ${t('reports.lorry.misc.kg')}`
    }
  ];

  const lorrySummary = calculateLorrySummary();
  const summary = calculateSummary();

  return (
    <Card
      title={
        <Space>
          <CarOutlined />
          {t('reports.lorry.title')} - {activeSeason.season_name}
        </Space>
      }
      extra={
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            disabled={purchases.length === 0}
          >
            {t('reports.lorry.downloadExcel')}
          </Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('reports.lorry.stats.totalLorries')}
              value={summary.totalLorries}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('reports.lorry.stats.totalTrips')}
              value={summary.totalTrips}
              prefix={<NumberOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('reports.lorry.stats.totalWeight')}
              value={summary.totalWeight}
              precision={2}
              suffix={t('reports.lorry.misc.kg')}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('reports.lorry.stats.avgWeightPerTrip')}
              value={summary.avgWeightPerTrip}
              precision={2}
              suffix={t('reports.lorry.misc.kg')}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={lorrySummary}
        rowKey="lorry_number"
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => t('reports.lorry.pagination.totalLorries').replace('{total}', total),
          showSizeChanger: true
        }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '12px 24px', background: '#fafafa' }}>
              <h4 style={{ marginBottom: 12 }}>{t('reports.lorry.tripDetailsTitle').replace('{lorryNo}', record.lorry_number)}</h4>
              <Table
                columns={[
                  {
                    title: t('reports.lorry.tripColumns.date'),
                    dataIndex: 'date',
                    key: 'date',
                    render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
                  },
                  {
                    title: t('reports.lorry.tripColumns.farmer'),
                    dataIndex: 'farmer',
                    key: 'farmer'
                  },
                  {
                    title: t('reports.lorry.tripColumns.weightKg'),
                    dataIndex: 'weight',
                    key: 'weight',
                    align: 'right',
                    render: (val) => val.toFixed(2)
                  },
                  {
                    title: t('reports.lorry.tripColumns.amountRm'),
                    dataIndex: 'amount',
                    key: 'amount',
                    align: 'right',
                    render: (val) => `RM ${val.toFixed(2)}`
                  }
                ]}
                dataSource={record.transactions}
                pagination={false}
                size="small"
                rowKey={(r, idx) => idx}
              />
            </div>
          ),
          expandRowByClick: true
        }}
        summary={() => {
          const totalTrips = lorrySummary.reduce((sum, l) => sum + l.frequency, 0);
          const totalWeight = lorrySummary.reduce((sum, l) => sum + l.cumulative_weight, 0);
          const totalAmount = lorrySummary.reduce((sum, l) => sum + l.total_amount, 0);
          
          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#fafafa' }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <strong>{t('reports.lorry.misc.total')}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong>{totalTrips}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <strong>{totalWeight.toFixed(2)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <strong>RM {totalAmount.toFixed(2)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
};

export default LorryReport;
