import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const MonthFilter = ({ visible, onClose, onApply, currentFilter }) => {
    const [selectedType, setSelectedType] = useState(currentFilter?.type || 'all');
    // Default to current date if not set
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(currentFilter?.year || now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentFilter?.month || now.getMonth() + 1);

    useEffect(() => {
        if (visible) {
            setSelectedType(currentFilter?.type || 'all');
            setSelectedYear(currentFilter?.year || now.getFullYear());
            setSelectedMonth(currentFilter?.month || now.getMonth() + 1);
        }
    }, [visible]);

    const handleApply = () => {
        let label = 'All Time';
        if (selectedType === 'thisMonth') {
            label = 'This Month';
        } else if (selectedType === 'lastMonth') {
            label = 'Last Month';
        } else if (selectedType === 'month') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            label = `${months[selectedMonth - 1]} ${selectedYear}`;
        }

        onApply({
            type: selectedType,
            month: selectedType === 'month' ? selectedMonth : null,
            year: selectedType === 'month' ? selectedYear : null,
            label
        });
        onClose();
    };

    // Generate years (e.g., last 5 years)
    const years = [];
    for (let i = 0; i < 5; i++) {
        years.push(now.getFullYear() - i);
    }

    const months = [
        { val: 1, name: 'Jan' }, { val: 2, name: 'Feb' }, { val: 3, name: 'Mar' },
        { val: 4, name: 'Apr' }, { val: 5, name: 'May' }, { val: 6, name: 'Jun' },
        { val: 7, name: 'Jul' }, { val: 8, name: 'Aug' }, { val: 9, name: 'Sep' },
        { val: 10, name: 'Oct' }, { val: 11, name: 'Nov' }, { val: 12, name: 'Dec' }
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Filter Data</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <Text style={styles.sectionTitle}>Time Period</Text>
                        <View style={styles.choicesContainer}>
                            {[
                                { key: 'all', label: 'All Time' },
                                { key: 'thisMonth', label: 'This Month' },
                                { key: 'lastMonth', label: 'Last Month' },
                                { key: 'month', label: 'Select Month' }
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    onPress={() => setSelectedType(option.key)}
                                    style={[
                                        styles.choiceButton,
                                        selectedType === option.key && styles.choiceActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.choiceText,
                                        selectedType === option.key && styles.choiceTextActive
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {selectedType === 'month' && (
                            <View style={styles.customPicker}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.subLabel}>Year</Text>
                                    <ScrollView style={styles.scrollList} horizontal contentContainerStyle={{ alignItems: 'center' }}>
                                        {years.map(y => (
                                            <TouchableOpacity
                                                key={y}
                                                onPress={() => setSelectedYear(y)}
                                                style={[styles.pickerItem, selectedYear === y && styles.pickerItemActive]}
                                            >
                                                <Text style={[styles.pickerText, selectedYear === y && styles.pickerTextActive]}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.subLabel}>Month</Text>
                                    <ScrollView style={styles.scrollList} horizontal contentContainerStyle={{ alignItems: 'center' }}>
                                        {months.map(m => (
                                            <TouchableOpacity
                                                key={m.val}
                                                onPress={() => setSelectedMonth(m.val)}
                                                style={[styles.pickerItem, selectedMonth === m.val && styles.pickerItemActive]}
                                            >
                                                <Text style={[styles.pickerText, selectedMonth === m.val && styles.pickerTextActive]}>{m.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => {
                            setSelectedType('all');
                            handleApply(); // Reset implies apply All
                        }} style={[styles.actionButton, styles.resetButton]}>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleApply} style={[styles.actionButton, styles.applyButton]}>
                            <Text style={styles.applyText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeText: {
        fontSize: 16,
        color: '#666',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 10,
    },
    choicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    choiceButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
    },
    choiceActive: {
        backgroundColor: '#B71C1C',
    },
    choiceText: {
        color: '#333',
    },
    choiceTextActive: {
        color: '#fff',
    },
    customPicker: {
        marginTop: 16,
        padding: 10,
        backgroundColor: '#fafafa',
        borderRadius: 12,
        flexDirection: 'column',
    },
    subLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    scrollList: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    pickerItem: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    pickerItemActive: {
        backgroundColor: '#B71C1C',
        borderColor: '#B71C1C',
    },
    pickerText: {
        color: '#333',
    },
    pickerTextActive: {
        color: '#fff',
    },
    footer: {
        marginTop: 24,
        flexDirection: 'row',
    },
    actionButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: '#f5f5f5',
        marginRight: 10,
    },
    applyButton: {
        backgroundColor: '#B71C1C',
    },
    resetText: {
        fontWeight: '600',
        color: '#555',
    },
    applyText: {
        fontWeight: '600',
        color: '#fff',
    },
});

export default MonthFilter;
