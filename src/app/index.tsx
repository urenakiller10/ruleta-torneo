import { useRef, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tournament from '@/data/teams.json';

type Team = (typeof tournament.teams)[number];
const logos: Record<string, ImageSourcePropType> = {
  'tec.png': require('../../assets/teams/tec.png'),
  'ucr.png': require('../../assets/teams/ucr.png'),
  'una.png': require('../../assets/teams/una.png'),
};
const wheels: Record<number, ImageSourcePropType> = {
  0: require('../../assets/wheels/wheel-0.png'),
  1: require('../../assets/wheels/wheel-1.png'),
  2: require('../../assets/wheels/wheel-2.png'),
  3: require('../../assets/wheels/wheel-3.png'),
  4: require('../../assets/wheels/wheel-4.png'),
};

function Logo({ team, size = 78 }: { team: Team; size?: number }) {
  return <View style={[styles.logoFrame, { width: size, height: size * .76 }]}><Image source={logos[team.image]} style={styles.logoImage} resizeMode="contain" /></View>;
}
function EmptyLogo() { return <View style={[styles.logoFrame, styles.emptyLogo]}><Text style={styles.emptyText}>?</Text></View>; }
function Heading({ number, kicker, title, note }: { number: string; kicker: string; title: string; note: string }) {
  return <View style={styles.heading}><View style={styles.headingNumber}><Text style={styles.headingNumberText}>{number}</Text></View><View style={styles.headingCopy}><Text style={styles.kicker}>{kicker}</Text><Text style={styles.headingTitle}>{title}</Text></View><Text style={styles.headingNote}>{note}</Text></View>;
}
function Match({ number, teams }: { number: string; teams: (Team | undefined)[] }) {
  return <View style={styles.match}><View style={styles.matchHeader}><Text style={styles.matchTag}>PARTIDO {number}</Text><Text style={styles.matchMeta}>CRUCE DEL SORTEO</Text></View><View style={styles.matchBody}>
    {teams.map((team, index) => <View key={index} style={styles.matchSide}>{team ? <Logo team={team} size={82} /> : <EmptyLogo />}<Text style={[styles.matchName, !team && styles.muted]} numberOfLines={2}>{team?.name ?? 'Por definir'}</Text></View>)}
    <View style={styles.vs}><Text style={styles.vsText}>VS</Text></View>
  </View></View>;
}

export default function HomeScreen() {
  const [size, setSize] = useState(320);
  const [drawn, setDrawn] = useState<Team[]>([]);
  const [spinning, setSpinning] = useState(false);
  const spinningRef = useRef(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const remaining = tournament.teams.filter((team) => !drawn.some((item) => item.id === team.id));
  const angle = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const reverseAngle = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '-360deg'] });
  const complete = remaining.length === 0;
  const spin = () => {
    if (spinningRef.current || complete) return;
    const index = Math.floor(Math.random() * remaining.length);
    const selected = remaining[index];
    const centerAngle = (index + .5) * 360 / remaining.length;
    spinningRef.current = true;
    setSpinning(true);
    rotation.setValue(0);
    Animated.timing(rotation, { toValue: 360 * 5 + (360 - centerAngle) % 360, duration: 3200, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
      if (finished) {
        rotation.setValue(0);
        const lastTeam = remaining.length === 2 ? remaining.find((team) => team.id !== selected.id) : undefined;
        setDrawn((previous) => lastTeam ? [...previous, selected, lastTeam] : [...previous, selected]);
      }
      spinningRef.current = false;
      setSpinning(false);
    });
  };
  const reset = () => { if (spinningRef.current) return; rotation.setValue(0); setDrawn([]); };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
    <View style={styles.hero}><Image source={require('../../assets/images/handbol.jpg')} style={styles.heroBackground} resizeMode="cover" /><View style={styles.heroShade} /><View style={styles.heroLogoFrame}><Image source={require('../../assets/images/fedeu.png')} style={styles.heroLogo} resizeMode="contain" accessibilityLabel="Logo FedeU Costa Rica" /></View><Text style={styles.heroTitle}>{tournament.tournament}</Text><View style={styles.heroRule}><View style={styles.ruleLine} /><View style={styles.ruleDiamond} /><View style={styles.ruleLine} /></View></View>
    <Heading number="01" kicker="EL SORTEO" title="Gira la ruleta" note={`${drawn.length} DE 4`} />
    <View style={styles.wheelCard} onLayout={(event) => {
      const measured = Math.min(event.nativeEvent.layout.width - 28, 388);
      if (measured > 0 && measured !== size) setSize(measured);
    }}>
      <Text style={styles.instruction}>{complete ? 'Cruces definidos: el último equipo recibió la cuarta posición' : spinning ? 'La ruleta está girando...' : `Toca el centro para elegir el equipo ${drawn.length + 1}`}</Text>
      <View style={[styles.wheelArea, { width: size, height: size + 22 }]}><View style={styles.pointer} />
        <Animated.View style={[styles.wheel, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate: angle }] }]}>
          <Image source={wheels[remaining.length]} style={styles.wheelArt} resizeMode="stretch" />
          {remaining.map((team, index) => {
            const theta = (index + .5) * 2 * Math.PI / remaining.length;
            const radius = size * .29;
            const x = size / 2 + Math.sin(theta) * radius;
            const y = size / 2 - Math.cos(theta) * radius;
            return <Animated.View key={team.id} style={[styles.wheelTeam, { left: x - 49, top: y - 39, transform: [{ rotate: reverseAngle }] }]}><Logo team={team} size={66} /><Text style={styles.wheelTeamName} numberOfLines={2}>{team.name}</Text></Animated.View>;
          })}
        </Animated.View>
        <Pressable accessibilityRole="button" accessibilityLabel={complete ? 'Sorteo completo' : 'Girar la ruleta'} onPress={spin} disabled={spinning || complete} style={({ pressed }) => [styles.wheelButton, { left: size / 2 - 44, top: (size + 22) / 2 - 44 }, pressed && styles.pressed]}><Text style={styles.wheelButtonIcon}>{complete ? '✓' : '↻'}</Text><Text style={styles.wheelButtonText}>{complete ? 'LISTO' : spinning ? 'GIRANDO' : 'GIRAR'}</Text></Pressable>
      </View>
      <View style={styles.remainingPill}><View style={styles.remainingDot} /><Text style={styles.remainingText}>{complete ? 'Sorteo completado' : `${remaining.length} ${remaining.length === 1 ? 'equipo disponible' : 'equipos disponibles'}`}</Text></View>
    </View>
    <Heading number="02" kicker="RESULTADO DEL SORTEO" title="Posiciones" note="ORDEN DE SALIDA" />
    <View style={styles.positions}>{[0, 1, 2, 3].map((index) => <View key={index} style={[styles.position, index === 3 && styles.lastPosition]}><View style={[styles.positionNumber, drawn[index] && styles.positionNumberFilled]}><Text style={[styles.positionNumberText, drawn[index] && styles.positionNumberTextFilled]}>{index + 1}</Text></View>{drawn[index] ? <Logo team={drawn[index]} /> : <EmptyLogo />}<View style={styles.positionCopy}><Text style={[styles.positionName, !drawn[index] && styles.muted]}>{drawn[index]?.name ?? 'Esperando sorteo'}</Text><Text style={styles.positionSub}>{drawn[index] ? (index === 3 ? 'Asignado automáticamente' : 'Equipo seleccionado') : 'Pendiente'}</Text></View><Text style={styles.positionCheck}>{drawn[index] ? '✓' : '·'}</Text></View>)}</View>
    <Heading number="03" kicker="ENFRENTAMIENTOS" title="Cruces" note="2 PARTIDOS" />
    <Text style={styles.bracketNote}>El primero juega contra el cuarto; el segundo, contra el tercero.</Text>
    <View style={styles.matches}><Match number="01" teams={[drawn[0], drawn[3]]} /><Match number="02" teams={[drawn[1], drawn[2]]} /></View>
    <Pressable onPress={reset} disabled={spinning} accessibilityRole="button" style={({ pressed }) => [styles.reset, pressed && styles.pressed]}><Text style={styles.resetText}>↺  Reiniciar sorteo</Text></Pressable>
    <Text style={styles.footer}>FESTIVAL UNIVERSITARIO DE BALONMANO 2026</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5FB' }, page: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 },
  hero: { minHeight: 330, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0C103A', borderRadius: 28, paddingHorizontal: 28, paddingVertical: 34, marginBottom: 34, overflow: 'hidden', borderWidth: 1, borderColor: '#353AAA' }, heroBackground: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' }, heroShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3, 13, 48, 0.62)' }, heroLogoFrame: { width: 112, height: 92, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, padding: 7 }, heroLogo: { width: '100%', height: '100%' }, heroTitle: { color: '#FFFFFF', textAlign: 'center', fontWeight: '900', fontSize: 38, lineHeight: 43, letterSpacing: -1.4, maxWidth: 680 }, heroRule: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 21 }, ruleLine: { width: 48, height: 2, borderRadius: 2, backgroundColor: '#E82750' }, ruleDiamond: { width: 8, height: 8, backgroundColor: '#F4A2B4', transform: [{ rotate: '45deg' }] },
  heading: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 17, gap: 13 }, headingNumber: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#D0123E', borderWidth: 1, borderColor: '#D0123E', alignItems: 'center', justifyContent: 'center' }, headingNumberText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 }, headingCopy: { flex: 1 }, kicker: { color: '#C9143E', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 3 }, headingTitle: { color: '#101945', fontSize: 25, fontWeight: '900', letterSpacing: -.7 }, headingNote: { color: '#B5153B', fontSize: 9, fontWeight: '900', letterSpacing: .4, backgroundColor: '#FCE8ED', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  wheelCard: { backgroundColor: '#101742', borderRadius: 26, alignItems: 'center', paddingHorizontal: 14, paddingTop: 22, paddingBottom: 21, marginBottom: 32, borderWidth: 1, borderColor: '#3644A4' }, instruction: { color: '#E7EAFB', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 15, paddingHorizontal: 8 }, wheelArea: { alignItems: 'center', justifyContent: 'center' }, pointer: { position: 'absolute', top: 0, zIndex: 3, width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderTopWidth: 24, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF' }, wheel: { overflow: 'hidden' }, wheelArt: { width: '100%', height: '100%', position: 'absolute' }, wheelTeam: { position: 'absolute', width: 98, height: 78, alignItems: 'center', justifyContent: 'center' }, wheelTeamName: { color: '#101742', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, fontSize: 11, lineHeight: 12, fontWeight: '900', textAlign: 'center', marginTop: 3 }, wheelButton: { position: 'absolute', zIndex: 5, width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFFFF', borderWidth: 5, borderColor: '#D0123E', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#060B28', shadowOpacity: .25, shadowRadius: 8 }, wheelButtonIcon: { color: '#CB123B', fontSize: 31, lineHeight: 31, fontWeight: '800' }, wheelButtonText: { color: '#101945', fontSize: 10, fontWeight: '900', letterSpacing: .8 }, pressed: { opacity: .75 }, remainingPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#273174', borderRadius: 15, paddingHorizontal: 13, paddingVertical: 8, marginTop: 12 }, remainingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E5234E' }, remainingText: { color: '#EEF1FF', fontSize: 11, fontWeight: '800' },
  positions: { backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 17, marginBottom: 32, borderWidth: 1, borderColor: '#E0E4F1' }, position: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 94, borderBottomWidth: 1, borderBottomColor: '#EBECF5' }, lastPosition: { borderBottomWidth: 0 }, positionNumber: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F3F8', alignItems: 'center', justifyContent: 'center' }, positionNumberFilled: { backgroundColor: '#26358F' }, positionNumberText: { color: '#A3ABC6', fontSize: 15, fontWeight: '900' }, positionNumberTextFilled: { color: '#FFFFFF' }, logoFrame: { width: 78, height: 59, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E4F1', alignItems: 'center', justifyContent: 'center', padding: 5, overflow: 'hidden' }, logoImage: { width: '100%', height: '100%' }, emptyLogo: { backgroundColor: '#F5F6FC', borderStyle: 'dashed' }, emptyText: { color: '#AAB0CB', fontSize: 22, fontWeight: '700' }, positionCopy: { flex: 1 }, positionName: { color: '#182354', fontSize: 16, fontWeight: '900' }, positionSub: { color: '#818BAC', fontSize: 10, fontWeight: '700', marginTop: 3 }, positionCheck: { color: '#CB123B', fontSize: 21, fontWeight: '900', marginRight: 7 }, muted: { color: '#9BA3BD' },
  bracketNote: { color: '#616C91', fontSize: 13, lineHeight: 19, marginBottom: 15, marginTop: -3 }, matches: { gap: 12 }, match: { backgroundColor: '#FFFFFF', borderRadius: 21, padding: 16, borderWidth: 1, borderColor: '#E0E4F1' }, matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }, matchTag: { color: '#B5153B', fontSize: 10, fontWeight: '900', letterSpacing: .7, backgroundColor: '#FBE2E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }, matchMeta: { color: '#8A91AB', fontSize: 9, fontWeight: '900', letterSpacing: .6 }, matchBody: { flexDirection: 'row', alignItems: 'center', position: 'relative', gap: 10 }, matchSide: { flex: 1, minHeight: 132, backgroundColor: '#F5F6FC', borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 8 }, matchName: { color: '#172458', fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 7 }, vs: { position: 'absolute', left: '50%', marginLeft: -18, zIndex: 1, width: 36, height: 36, borderRadius: 18, backgroundColor: '#D0123E', borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, vsText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' }, reset: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 15, marginTop: 21, marginBottom: 13 }, resetText: { color: '#AF1741', fontSize: 13, fontWeight: '900' }, footer: { borderTopWidth: 1, borderColor: '#E0E4F1', paddingTop: 21, textAlign: 'center', color: '#9198AF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});
