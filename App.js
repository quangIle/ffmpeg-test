import { Asset } from "expo-asset"
import { StatusBar } from "expo-status-bar"
import {
  FFmpegKit,
  FFmpegKitConfig,
  Level,
  SessionState,
} from "ffmpeg-kit-react-native"
import { useEffect, useState } from "react"
import { Button, StyleSheet, Text, View } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import { Audio } from "expo-av"

export default function App() {
  const [source, setSource] = useState(null)
  const [dest, setDest] = useState(null)
  const [status, requestPermisstion] = MediaLibrary.usePermissions()
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.cancelled) {
      setSource(result.uri)
    }
    const d = await getResultPath()
    setDest(d)
  }
  const getResultPath = async () => {
    const videoDir = `${FileSystem.cacheDirectory}video/`
    // Checks if gif directory exists. If not, creates it
    async function ensureDirExists() {
      const dirInfo = await FileSystem.getInfoAsync(videoDir)
      if (!dirInfo.exists) {
        console.log("tmp directory doesn't exist, creating...")
        await FileSystem.makeDirectoryAsync(videoDir, { intermediates: true })
      }
    }

    await ensureDirExists()

    return `${videoDir}sample.mp3`
  }
  const run = () => {
    const ffmpegCommand = `-y -i ${source} -q:a 0 -map a ${dest}`
    console.log(
      `Current log level is ${Level.levelToString(
        FFmpegKitConfig.getLogLevel()
      )}.`
    )

    console.log("Testing FFmpeg COMMAND asynchronously.")

    console.log(`FFmpeg process started with arguments:\n\'${ffmpegCommand}\'.`)
    FFmpegKit.execute(ffmpegCommand).then(async (session) => {
      const state = FFmpegKitConfig.sessionStateToString(
        await session.getState()
      )
      const returnCode = await session.getReturnCode()
      const failStackTrace = await session.getFailStackTrace()
      const output = await session.getOutput()

      console.log(
        `FFmpeg process exited with state ${state} and rc ${returnCode}.${
          failStackTrace ?? "\\n"
        }`
      )

      console.log("output", output)

      if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
        console.log(
          "popup",
          "Command failed. Please check output for the details."
        )
        return
      }
      console.log("SUCCESS!")
      const { sound: playbackObject } = await Audio.Sound.createAsync(
        { uri: dest },
        { shouldPlay: true }
      )
      // playbackObject.playAsync()
    })
  }
  useEffect(() => {
    console.log("source", source)
  }, [source])
  useEffect(() => {
    console.log("dest", dest)
  }, [dest])
  useEffect(() => {
    if (!status) requestPermisstion()
  }, [])
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Button title="Open gallery" onPress={pickImage} />
      <Button title="Run ffmpeg" onPress={run} />
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
})
