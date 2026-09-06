import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard, Plus, Calendar as CalendarIcon, Clock, AlertCircle, RefreshCw,
  Trash2, Check, X, Music, Tv, Zap, Flame, Globe, Home as HomeIcon,
  Copy, Pencil, RotateCcw, PauseCircle, PlayCircle, Layers, CheckCircle2,
  Repeat, Hash, FileText
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useLedgr } from '../lib/LedgrContext';
import { useThemeColors } from '../lib/ThemeContext';
import { Bill, BillFrequency, autoCategorize } from '../lib/store';
import {
  format, differenceInDays, addMonths, addYears, addWeeks,
  subMonths, subYears, subWeeks, startOfDay
} from 'date-fns';
import { useSnackbar } from '../components/Snackbar';
import BillPaymentModal from '../components/BillPaymentModal';
import AddEditBillModal from '../components/AddEditBillModal';

const SUGGESTIONS = [
  { name: 'Electricity', icon: Zap, color: '#F59E0B', category: 'Bills' },
  { name: 'Gas', icon: Flame, color: '#F97316', category: 'Bills' },
  { name: 'Internet', icon: Globe, color: '#00F0FF', category: 'Bills' },
  { name: 'Rent', icon: HomeIcon, color: '#8A2BE2', category: 'Bills' },
  { name: 'Subscription', icon: CreditCard, color: '#FF007F', category: 'Shopping' },
];

type TabType = 'pending' | 'paid' | 'all';

export default function BillsScreen() {
  const { bills, addBill, updateBill, deleteBill, addExpense, allCategories } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [initialQuickName, setInitialQuickName] = useState('');

  const [isPayModalVisible, setIsPayModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);

  const currentMonthStr = format(new Date(), 'yyyy-MM');

  // Helper to determine if a bill was settled in the current month
  const isBillSettledThisMonth = (bill: Bill) => {
    if (bill.frequency === 'one-time' && bill.isPaid) return true;
    if (bill.lastPaidDate) {
      const paidMonth = format(new Date(bill.lastPaidDate), 'yyyy-MM');
      return paidMonth === currentMonthStr;
    }
    return false;
  };

  // Groupings & Summary Calculations
  const {
    pendingBills,
    paidBills,
    allBills,
    overdueBills,
    dueSoonBills,
    upcomingBills,
    totalPaidThisMonth,
    remainingToPay,
    totalCommitted,
    progressPercent,
  } = useMemo(() => {
    const today = startOfDay(new Date());
    const paid: Bill[] = [];
    const pending: Bill[] = [];
    const all = [...bills].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    let paidSum = 0;
    let remainingSum = 0;

    all.forEach(bill => {
      const isSettled = isBillSettledThisMonth(bill);
      if (isSettled) {
        paid.push(bill);
        paidSum += bill.lastPaidAmount || bill.amount;
      } else if (!bill.isPaused) {
        pending.push(bill);
        remainingSum += bill.amount;
      }
    });

    const committed = paidSum + remainingSum;
    const progress = committed > 0 ? Math.min(100, Math.round((paidSum / committed) * 100)) : 0;

    // Sub-group pending bills by urgency
    const overdue: Bill[] = [];
    const dueSoon: Bill[] = [];
    const upcoming: Bill[] = [];

    pending.forEach(b => {
      const dueDate = startOfDay(new Date(b.dueDate));
      const diff = differenceInDays(dueDate, today);
      if (diff < 0) overdue.push(b);
      else if (diff <= 3) dueSoon.push(b);
      else upcoming.push(b);
    });

    return {
      pendingBills: pending,
      paidBills: paid,
      allBills: all,
      overdueBills: overdue,
      dueSoonBills: dueSoon,
      upcomingBills: upcoming,
      totalPaidThisMonth: paidSum,
      remainingToPay: remainingSum,
      totalCommitted: committed,
      progressPercent: progress,
    };
  }, [bills, currentMonthStr]);

  const handleOpenAddModal = (name = '') => {
    setEditingBill(null);
    setInitialQuickName(name);
    setIsAddEditModalVisible(true);
  };

  const handleOpenEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setInitialQuickName('');
    setIsAddEditModalVisible(true);
  };

  const handleSaveBill = async (billData: Omit<Bill, 'id'> | Bill) => {
    if ('id' in billData) {
      await updateBill(billData as Bill);
      showSnackbar(`Updated ${billData.name}`);
    } else {
      await addBill(billData);
      showSnackbar(`Added ${billData.name}`);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    await deleteBill(billId);
    showSnackbar('Bill deleted');
  };

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPayModalVisible(true);
  };

  const handleConfirmPayment = async (amount: number) => {
    if (!selectedBill) return;

    // 1. Log expense in ledgr
    await addExpense({
      name: `Paid: ${selectedBill.name}`,
      amount,
      category: selectedBill.category || 'Bills',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    });

    // 2. Advance due date according to recurrence
    const currentDue = new Date(selectedBill.dueDate);
    let nextDue: Date;
    switch (selectedBill.frequency) {
      case 'yearly':
        nextDue = addYears(currentDue, 1);
        break;
      case 'quarterly':
        nextDue = addMonths(currentDue, 3);
        break;
      case 'weekly':
        nextDue = addWeeks(currentDue, 1);
        break;
      case 'one-time':
        nextDue = currentDue;
        break;
      case 'monthly':
      default:
        nextDue = addMonths(currentDue, 1);
        break;
    }

    const nowIso = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    await updateBill({
      ...selectedBill,
      dueDate: format(nextDue, "yyyy-MM-dd'T'HH:mm:ss"),
      lastPaidDate: nowIso,
      lastPaidAmount: amount,
      isPaid: selectedBill.frequency === 'one-time',
    });

    setIsPayModalVisible(false);
    showSnackbar(`Paid ${selectedBill.name} - PKR ${amount.toLocaleString()}`);
  };

  const handleUndoPayment = async (bill: Bill) => {
    Alert.alert(
      'Undo Bill Payment',
      `Revert ${bill.name} back to pending status for this month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo Payment',
          style: 'destructive',
          onPress: async () => {
            const currentDue = new Date(bill.dueDate);
            let prevDue: Date;
            switch (bill.frequency) {
              case 'yearly':
                prevDue = subYears(currentDue, 1);
                break;
              case 'quarterly':
                prevDue = subMonths(currentDue, 3);
                break;
              case 'weekly':
                prevDue = subWeeks(currentDue, 1);
                break;
              case 'one-time':
              case 'monthly':
              default:
                prevDue = subMonths(currentDue, 1);
                break;
            }

            await updateBill({
              ...bill,
              dueDate: format(prevDue, "yyyy-MM-dd'T'HH:mm:ss"),
              lastPaidDate: undefined,
              lastPaidAmount: undefined,
              isPaid: false,
            });
            showSnackbar(`Reverted ${bill.name} to pending`);
          },
        },
      ]
    );
  };

  const handleCopyRef = async (consumerNumber: string, billName: string) => {
    await Clipboard.setStringAsync(consumerNumber);
    showSnackbar(`Copied ${billName} Ref #${consumerNumber}`);
  };

  const getBillStatus = (dueDateStr: string, isSettled: boolean, lastPaidDate?: string) => {
    if (isSettled) {
      const paidDateFormatted = lastPaidDate ? format(new Date(lastPaidDate), 'MMM dd') : 'this month';
      return {
        label: `Paid on ${paidDateFormatted}`,
        color: colors.success,
        level: 'paid',
      };
    }
    const today = startOfDay(new Date());
    const dueDate = startOfDay(new Date(dueDateStr));
    const diff = differenceInDays(dueDate, today);
    if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, color: colors.danger, level: 'overdue' };
    if (diff === 0) return { label: 'Due Today', color: '#F97316', level: 'urgent' };
    if (diff <= 3) return { label: `Due in ${diff}d`, color: colors.warning, level: 'warning' };
    return { label: `Due in ${diff}d`, color: colors.textMuted, level: 'normal' };
  };

  const getBillIcon = (name: string) => {
    const suggestion = SUGGESTIONS.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (suggestion) return suggestion.icon;
    const lower = name.toLowerCase();
    if (lower.includes('electric') || lower.includes('light') || lower.includes('wapda') || lower.includes('lesco') || lower.includes('kelectric')) return Zap;
    if (lower.includes('gas') || lower.includes('sngpl')) return Flame;
    if (lower.includes('internet') || lower.includes('wifi') || lower.includes('ptcl') || lower.includes('nayatel') || lower.includes('stormfiber')) return Globe;
    if (lower.includes('rent') || lower.includes('house')) return HomeIcon;
    if (lower.includes('spotify') || lower.includes('music')) return Music;
    if (lower.includes('netflix') || lower.includes('tv') || lower.includes('youtube')) return Tv;
    return CreditCard;
  };

  const renderBillCard = (bill: Bill) => {
    const isSettled = isBillSettledThisMonth(bill);
    const isPaused = !!bill.isPaused;
    const status = getBillStatus(bill.dueDate, isSettled, bill.lastPaidDate);
    const BillIcon = getBillIcon(bill.name);
    const isUrgent = !isSettled && status.level !== 'normal';

    return (
      <LinearGradient
        key={bill.id}
        colors={
          isPaused
            ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)']
            : isSettled
            ? [`${colors.success}10`, colors.gradientEnd]
            : isUrgent
            ? [`${status.color}15`, colors.gradientEnd]
            : [colors.gradientStart, colors.gradientEnd]
        }
        style={[
          styles.billCard,
          {
            borderColor: isPaused
              ? colors.divider
              : isSettled
              ? `${colors.success}30`
              : status.level === 'overdue'
              ? `${status.color}50`
              : colors.cardBorderSubtle,
            opacity: isPaused ? 0.65 : 1,
          },
        ]}
      >
        {/* Top Info Row */}
        <View style={styles.billRow}>
          <View style={styles.billMain}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isSettled
                    ? `${colors.success}20`
                    : isPaused
                    ? colors.pillBg
                    : isUrgent
                    ? `${status.color}20`
                    : colors.pillBg,
                  borderColor: isSettled
                    ? `${colors.success}40`
                    : isUrgent
                    ? `${status.color}40`
                    : colors.cardBorderSubtle,
                },
              ]}
            >
              <BillIcon
                color={isSettled ? colors.success : isUrgent ? status.color : colors.accent}
                size={18}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameBadgesRow}>
                <Text style={[styles.billName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {bill.name}
                </Text>
                {isPaused && (
                  <View style={[styles.microBadge, { backgroundColor: `${colors.warning}20` }]}>
                    <Text style={[styles.microBadgeText, { color: colors.warning }]}>PAUSED</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                {bill.frequency && bill.frequency !== 'monthly' && (
                  <View style={[styles.frequencyPill, { borderColor: colors.cardBorderSubtle }]}>
                    <Text style={[styles.frequencyText, { color: colors.textTertiary }]}>
                      {bill.frequency.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.billStatus, { color: isPaused ? colors.textMuted : status.color }]}>
                  {isPaused ? 'Subscription paused' : status.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount & Due Date */}
          <View style={styles.billAmountContainer}>
            <Text style={[styles.billAmount, { color: colors.textPrimary }]}>
              PKR {bill.amount.toLocaleString()}
            </Text>
            <Text style={[styles.billDate, { color: colors.textSecondary }]}>
              {isSettled ? 'Next: ' : 'Due: '}
              {format(new Date(bill.dueDate), 'MMM dd')}
            </Text>
          </View>
        </View>

        {/* Consumer / Reference Number with 1-Tap Copy */}
        {bill.consumerNumber && (
          <TouchableOpacity
            style={[
              styles.consumerChip,
              { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
            ]}
            onPress={() => handleCopyRef(bill.consumerNumber!, bill.name)}
            activeOpacity={0.7}
          >
            <View style={styles.consumerLeft}>
              <Hash color={colors.accent} size={13} style={{ marginRight: 6 }} />
              <Text style={[styles.consumerLabel, { color: colors.textTertiary }]}>REF:</Text>
              <Text style={[styles.consumerValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {bill.consumerNumber}
              </Text>
            </View>
            <View style={[styles.copyPill, { backgroundColor: `${colors.accent}15` }]}>
              <Copy color={colors.accent} size={11} style={{ marginRight: 4 }} />
              <Text style={[styles.copyPillText, { color: colors.accent }]}>Copy</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Notes Preview (if any) */}
        {bill.notes && (
          <View style={styles.notesRow}>
            <FileText color={colors.textTertiary} size={11} style={{ marginRight: 6 }} />
            <Text style={[styles.notesText, { color: colors.textTertiary }]} numberOfLines={1}>
              {bill.notes}
            </Text>
          </View>
        )}

        {/* Bottom Actions Row */}
        <View style={[styles.cardActions, { borderTopColor: colors.divider }]}>
          {isSettled ? (
            <View style={styles.settledBadge}>
              <CheckCircle2 color={colors.success} size={14} style={{ marginRight: 6 }} />
              <Text style={[styles.settledText, { color: colors.success }]}>Settled this month</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.payBtn,
                {
                  backgroundColor: isUrgent ? `${status.color}25` : `${colors.purple}15`,
                  borderColor: isUrgent ? `${status.color}40` : `${colors.purple}40`,
                },
              ]}
              onPress={() => handlePayBill(bill)}
              activeOpacity={0.8}
            >
              <RefreshCw
                color={isUrgent ? status.color : colors.purple}
                size={12}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.payBtnText, { color: isUrgent ? status.color : colors.purple }]}>
                Paid & Renew
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionRight}>
            {/* Undo action for settled bills */}
            {isSettled && (
              <TouchableOpacity
                style={[styles.undoBtn, { backgroundColor: colors.pillBg }]}
                onPress={() => handleUndoPayment(bill)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <RotateCcw color={colors.textSecondary} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.undoBtnText, { color: colors.textSecondary }]}>Undo</Text>
              </TouchableOpacity>
            )}

            {/* Edit Button */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.pillBg }]}
              onPress={() => handleOpenEditModal(bill)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pencil color={colors.textSecondary} size={14} />
            </TouchableOpacity>

            {/* Quick Delete confirmation inline */}
            {deletingBillId === bill.id ? (
              <View style={styles.confirmDeleteContainer}>
                <TouchableOpacity
                  style={[styles.miniActionBtn, styles.confirmAction]}
                  onPress={() => {
                    handleDeleteBill(bill.id);
                    setDeletingBillId(null);
                  }}
                >
                  <Check color="#FFFFFF" size={12} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniActionBtn, styles.cancelAction]}
                  onPress={() => setDeletingBillId(null)}
                >
                  <X color="#FFFFFF" size={12} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setDeletingBillId(bill.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 color={colors.textMuted} size={14} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderActiveList = () => {
    if (activeTab === 'paid') {
      if (paidBills.length === 0) {
        return (
          <View style={styles.emptyState}>
            <CheckCircle2 color={colors.divider} size={64} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No paid bills yet</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
              Bills you pay and renew this month will appear here.
            </Text>
          </View>
        );
      }
      return <View style={styles.billsList}>{paidBills.map(renderBillCard)}</View>;
    }

    if (activeTab === 'all') {
      if (allBills.length === 0) {
        return (
          <View style={styles.emptyState}>
            <CreditCard color={colors.divider} size={64} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No bills tracked</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
              Add subscriptions or recurring utilities using the + button below.
            </Text>
          </View>
        );
      }
      return <View style={styles.billsList}>{allBills.map(renderBillCard)}</View>;
    }

    // Default: 'pending' tab
    if (pendingBills.length === 0) {
      return (
        <View style={styles.emptyState}>
          <CheckCircle2 color={colors.success} size={64} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All clear for {format(new Date(), 'MMMM')}!</Text>
          <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
            All committed bills for this month have been paid and renewed.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.billsList}>
        {/* Overdue Section */}
        {overdueBills.length > 0 && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <AlertCircle color={colors.danger} size={14} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>
                OVERDUE ({overdueBills.length})
              </Text>
            </View>
            {overdueBills.map(renderBillCard)}
          </View>
        )}

        {/* Due Soon Section (Within 3 Days) */}
        {dueSoonBills.length > 0 && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Clock color={colors.warning} size={14} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                DUE SOON ({dueSoonBills.length})
              </Text>
            </View>
            {dueSoonBills.map(renderBillCard)}
          </View>
        )}

        {/* Upcoming Section */}
        {upcomingBills.length > 0 && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <CalendarIcon color={colors.textSecondary} size={14} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                UPCOMING ({upcomingBills.length})
              </Text>
            </View>
            {upcomingBills.map(renderBillCard)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTopLeft}>
              <Image source={require('../../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
              <Text style={[styles.brandNameSmall, { color: colors.textTertiary }]}>LEDGR</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={[styles.headerTitleSmall, { color: colors.textPrimary }]}>Bills & Subscriptions</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Financial Summary Card */}
        <View style={styles.summaryCardContainer}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={[styles.summaryCard, { borderColor: colors.cardBorder }]}
          >
            <View style={styles.summaryCardRow}>
              <View>
                <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>
                  COMMITTED IN {format(new Date(), 'MMMM').toUpperCase()}
                </Text>
                <Text style={[styles.summaryCardValue, { color: colors.textPrimary }]}>
                  PKR {totalCommitted.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.summaryIconBox, { backgroundColor: `${colors.purple}15` }]}>
                <CreditCard color={colors.purple} size={24} />
              </View>
            </View>

            {/* Split Progress Bar */}
            <View style={[styles.summaryProgressBg, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <View
                style={[
                  styles.summaryProgressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent === 100 ? colors.success : colors.accent,
                  },
                ]}
              />
            </View>

            {/* Sub Stats Row */}
            <View style={styles.summarySubRow}>
              <View style={styles.subStat}>
                <View style={[styles.subStatDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.subStatLabel, { color: colors.textTertiary }]}>Paid: </Text>
                <Text style={[styles.subStatValue, { color: colors.textPrimary }]}>
                  PKR {totalPaidThisMonth.toLocaleString()}
                </Text>
              </View>

              <View style={styles.subStat}>
                <View style={[styles.subStatDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.subStatLabel, { color: colors.textTertiary }]}>Remaining: </Text>
                <Text style={[styles.subStatValue, { color: colors.textPrimary }]}>
                  PKR {remainingToPay.toLocaleString()}
                </Text>
              </View>

              <Text style={[styles.subStatPercent, { color: colors.textSecondary }]}>
                {progressPercent}%
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Segmented Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'pending' && [
                styles.tabItemActive,
                { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
              ],
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'pending' ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              Pending
            </Text>
            {pendingBills.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor: overdueBills.length > 0 ? colors.danger : colors.purple,
                  },
                ]}
              >
                <Text style={styles.tabBadgeText}>{pendingBills.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'paid' && [
                styles.tabItemActive,
                { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
              ],
            ]}
            onPress={() => setActiveTab('paid')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'paid' ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              Settled
            </Text>
            {paidBills.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.tabBadgeText}>{paidBills.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'all' && [
                styles.tabItemActive,
                { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
              ],
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'all' ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              All ({allBills.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bill Cards List */}
        {renderActiveList()}

        {/* Quick Add Section */}
        <View style={styles.suggestionsHeader}>
          <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>QUICK TEMPLATES</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}
        >
          {SUGGESTIONS.map(s => (
            <TouchableOpacity
              key={s.name}
              style={[
                styles.suggestionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
              ]}
              onPress={() => handleOpenAddModal(s.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.suggestionIcon, { backgroundColor: `${s.color}20` }]}>
                <s.icon color={s.color} size={18} />
              </View>
              <Text style={[styles.suggestionName, { color: colors.textSecondary }]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Add / Edit Bill Modal */}
      <AddEditBillModal
        visible={isAddEditModalVisible}
        bill={editingBill}
        initialName={initialQuickName}
        categories={allCategories}
        onClose={() => {
          setIsAddEditModalVisible(false);
          setEditingBill(null);
        }}
        onSave={handleSaveBill}
        onDelete={handleDeleteBill}
      />

      {/* Payment Confirmation Modal */}
      <BillPaymentModal
        visible={isPayModalVisible}
        bill={selectedBill}
        onClose={() => setIsPayModalVisible(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.purple, shadowColor: colors.purple }]}
        onPress={() => handleOpenAddModal()}
        activeOpacity={0.8}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  header: { marginBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTopLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerTitleSmall: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  logoSmall: { width: 18, height: 18, marginRight: 10 },
  brandNameSmall: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 2 },

  summaryCardContainer: { marginBottom: 16 },
  summaryCard: { padding: 18, borderRadius: 24, borderWidth: 1 },
  summaryCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryCardLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 4 },
  summaryCardValue: { fontSize: 26, fontFamily: 'Outfit_600SemiBold' },
  summaryIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  summaryProgressFill: { height: '100%', borderRadius: 3 },
  summarySubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subStat: { flexDirection: 'row', alignItems: 'center' },
  subStatDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  subStatLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  subStatValue: { fontSize: 12, fontFamily: 'Outfit_600SemiBold' },
  subStatPercent: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabItemActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },

  billsList: { gap: 12 },
  sectionGroup: { gap: 10, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingLeft: 4 },
  sectionTitle: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },

  billCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billMain: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nameBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  billName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', flexShrink: 1 },
  microBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  microBadgeText: { fontSize: 8, fontFamily: 'Inter_700Bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  frequencyPill: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  frequencyText: { fontSize: 8, fontFamily: 'Inter_700Bold' },
  billStatus: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  billAmountContainer: { alignItems: 'flex-end' },
  billAmount: { fontSize: 20, fontFamily: 'Outfit_600SemiBold' },
  billDate: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },

  consumerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  consumerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  consumerLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginRight: 4 },
  consumerValue: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', flex: 1 },
  copyPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  copyPillText: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  notesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 },
  notesText: { fontSize: 11, fontFamily: 'Inter_400Regular', fontStyle: 'italic', flex: 1 },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  payBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  settledBadge: { flexDirection: 'row', alignItems: 'center' },
  settledText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  undoBtnText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteContainer: { flexDirection: 'row', gap: 6 },
  miniActionBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  confirmAction: { backgroundColor: '#10B981' },
  cancelAction: { backgroundColor: '#EF4444' },

  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, fontFamily: 'Outfit_600SemiBold', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },

  suggestionsHeader: { marginTop: 24, marginBottom: 10 },
  suggestionsTitle: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  suggestionsScroll: { gap: 10, paddingBottom: 10 },
  suggestionCard: { width: 88, padding: 10, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  suggestionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  suggestionName: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});