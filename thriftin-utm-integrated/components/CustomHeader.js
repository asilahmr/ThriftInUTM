import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const CustomHeader = ({ navigation, route, options, back }) => {
    const title = options.title !== undefined ? options.title : options.headerTitle !== undefined ? options.headerTitle : route.name;

    return (
        <View style={styles.headerContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.headerContent}>
                    {back && options.headerLeft !== undefined && options.headerLeft === null ? (
                        <View style={styles.placeholder} />
                    ) : back ? (
                        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.placeholder} />
                    )}

                    <Text style={styles.headerTitle}>{title}</Text>

                    {options.headerRight ? (
                        <View style={styles.rightContainer}>
                            {options.headerRight()}
                        </View>
                    ) : (
                        <View style={styles.placeholder} />
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 100,
    },
    safeArea: {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
    },
    headerContent: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 5,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    rightContainer: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    placeholder: {
        width: 40,
    },
});

export default CustomHeader;
